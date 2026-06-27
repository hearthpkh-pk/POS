import { supabase } from '../core/SupabaseClient.js';
import { Utils } from '../utils.js';

const STORAGE_BUCKET = 'restaurant-images';

export class AdminMenuView {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.categories = [];
        this.searchTerm = '';
        this.selectedCategory = 'all';
        this.currentUploadedImageUrl = '';
        this.editingMenuId = null;
        
        // Callback bindings
        this.onSaveMenuCallback = null;
        this.onEditMenuCallback = null;
        this.onDeleteMenuCallback = null;
        this.onCancelEditCallback = null;
        this.onToggleSoldOutCallback = null;
    }

    setCategories(categories) {
        this.categories = categories || [];
    }

    render(menuTree = [], editingMenuId = null) {
        if (!this.container) return;

        const flatMenu = menuTree;
        const editingItem = editingMenuId ? flatMenu.find(m => m.id === editingMenuId) : null;
        
        this.editingMenuId = editingMenuId;
        this.currentUploadedImageUrl = editingItem ? (editingItem.image_url || '') : '';

        const html = `
        <div class="p-4 lg:p-6 h-full overflow-y-auto custom-scroll bg-[#F2F2F7]">
            <div class="mb-6 flex justify-between items-center">
                <div>
                    <h2 class="text-xl font-bold text-gray-900 leading-tight">จัดการเมนู</h2>
                    <p class="text-xs text-gray-500 mt-1">จัดการรายการสินค้า อาหาร เครื่องดื่ม และรูปภาพประจำเมนู</p>
                </div>
                ${editingMenuId ? `
                <button id="btn-add-new-trigger" class="ios-action-btn ios-btn-primary px-4 py-2 text-xs font-bold flex items-center gap-1.5 shadow-sm">
                    <i class="fas fa-plus"></i> เพิ่มเมนูใหม่
                </button>
                ` : ''}
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <!-- LEFT COLUMN: MASTER LIST (lg:col-span-7) -->
                <div class="lg:col-span-7 flex flex-col gap-4">
                    <!-- Search & Filter Card -->
                    <div class="bg-white p-4 border border-gray-150 shadow-sm rounded-2xl">
                        <div class="relative flex items-center mb-3 gap-2">
                            <div class="relative flex-grow">
                                <span class="absolute left-3.5 text-gray-400">
                                    <i class="fas fa-search text-xs"></i>
                                </span>
                                <input type="text" id="menu-search" class="w-full bg-[#F2F2F7] rounded-xl pl-9 pr-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none transition border-none focus:ring-1 focus:ring-[#007AFF]" placeholder="ค้นหาเมนูอาหาร/เครื่องดื่ม...">
                            </div>
                            <button id="btn-manage-categories" class="bg-[#F2F2F7] hover:bg-gray-200 text-[#007AFF] px-3.5 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-1.5 shadow-sm border border-gray-150 shrink-0 select-none">
                                <i class="fas fa-tags text-xs"></i> <span class="hidden sm:inline">หมวดหมู่</span>
                            </button>
                        </div>
                        
                        <!-- Horizontal Scroll Category Chips -->
                        <div class="flex gap-2 overflow-x-auto pb-1.5 custom-scroll scrollbar-none snap-x select-none">
                            <button class="category-chip shrink-0 px-3 py-1.5 text-xs font-bold rounded-full border border-gray-200/80 bg-white text-gray-600 transition" data-id="all">
                                ทั้งหมด
                            </button>
                            ${this.categories.map(c => `
                                <button class="category-chip shrink-0 px-3 py-1.5 text-xs font-bold rounded-full border border-gray-200/80 bg-white text-gray-600 transition" data-id="${c.id}">
                                    ${c.name_th}
                                </button>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Items List -->
                    <div class="bg-white p-4 border border-gray-150 shadow-sm rounded-2xl">
                        <div class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">เมนูอาหารทั้งหมด (${flatMenu.length})</div>
                        <div class="space-y-2 max-h-[60vh] overflow-y-auto custom-scroll pr-1">
                            ${flatMenu.length === 0 
                                ? '<div class="text-center text-gray-400 py-10 text-xs italic">ไม่พบข้อมูลเมนูอาหาร</div>' 
                                : flatMenu.map(item => {
                                    const hasImage = !!item.image_url;
                                    const cardActiveBorder = editingMenuId === item.id ? 'border-[#007AFF] bg-[#007AFF]/5' : 'border-gray-100 bg-white hover:border-gray-250';
                                    return `
                                    <div class="menu-item-row flex items-center p-3 border rounded-2xl transition ${cardActiveBorder}" 
                                         data-id="${item.id}"
                                         data-name-th="${item.name_th.toLowerCase()}" 
                                         data-name-en="${(item.name_en || '').toLowerCase()}" 
                                         data-category-id="${item.category_id || ''}">
                                        
                                        <!-- Thumbnail click selects item -->
                                        <div class="w-12 h-12 rounded-xl bg-gray-100 border border-gray-100 overflow-hidden flex items-center justify-center shrink-0 mr-3.5 cursor-pointer" data-action="select-item" data-id="${item.id}">
                                            ${hasImage 
                                                ? `<img src="${item.image_url}" class="w-full h-full object-cover">` 
                                                : `<i class="fas fa-burger text-gray-300 text-sm"></i>`
                                            }
                                        </div>
                                        
                                        <!-- Details click selects item -->
                                        <div class="flex-grow min-w-0 mr-3 cursor-pointer" data-action="select-item" data-id="${item.id}">
                                            <div class="font-bold text-gray-900 text-sm truncate flex items-center gap-1.5">
                                                <span>${item.name_th}</span>
                                                <span class="text-[10px] text-gray-400 font-normal">(${item.categories?.name_th || 'N/A'})</span>
                                            </div>
                                            <!-- Fixed currency duplicate bug by using formatCurrency directly -->
                                            <div class="text-xs text-gray-500 font-semibold mt-0.5">ราคา: ${Utils.formatCurrency(item.base_price_cents)}</div>
                                            <div class="mt-1 flex items-center gap-1.5">
                                                <span id="soldout-badge-${item.id}" class="soldout-badge ${item.is_sold_out ? '' : 'hidden'} bg-[#FFEAEA] text-[#FF3B30] text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 border border-[#FFEAEA]">
                                                    <i class="fas fa-exclamation-circle"></i> ของหมดชั่วคราว
                                                </span>
                                            </div>
                                        </div>

                                        <!-- Quick Toggle & Actions -->
                                        <div class="flex items-center gap-3 shrink-0">
                                            <div class="flex flex-col items-end mr-1">
                                                <span class="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-1 select-none">มีสินค้า</span>
                                                <label class="ios-switch relative inline-flex items-center cursor-pointer select-none">
                                                    <input type="checkbox" data-action="toggle-soldout" data-id="${item.id}" class="sr-only peer" ${item.is_sold_out ? '' : 'checked'}>
                                                    <div class="w-8 h-4.5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-350 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-[#34C759]"></div>
                                                </label>
                                            </div>
                                            <button data-action="delete-menu" data-id="${item.id}" title="ลบ" class="text-gray-400 hover:text-[#FF3B30] p-2 hover:bg-[#FFEAEA] rounded-xl transition">
                                                <i class="fas fa-trash text-xs pointer-events-none"></i>
                                            </button>
                                        </div>
                                    </div>
                                    `;
                                }).join('')}
                        </div>
                    </div>
                </div>

                <!-- RIGHT COLUMN: DETAIL/EDITOR PANE (lg:col-span-5) -->
                <div class="lg:col-span-5" id="editor-panel-anchor">
                    <div class="bg-white p-5 border border-gray-150 shadow-sm rounded-2xl">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="font-bold text-gray-900 text-base">
                                ${editingItem ? '<i class="fas fa-pen text-[#007AFF] mr-1"></i> แก้ไขข้อมูลเมนู' : '<i class="fas fa-plus text-[#34C759] mr-1"></i> เพิ่มเมนูใหม่'}
                            </h3>
                            ${editingItem ? `
                            <button id="btn-cancel-edit-text" class="text-xs text-[#007AFF] font-bold hover:underline select-none">
                                กลับไปโหมดเพิ่มใหม่
                            </button>
                            ` : ''}
                        </div>

                        <div class="space-y-4">
                            <!-- Image Upload Zone -->
                            <div class="space-y-2">
                                <label class="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">รูปภาพประจำเมนู</label>
                                <div id="menu-image-dropzone" class="w-full aspect-[4/3] bg-gray-50 border border-dashed border-gray-250 rounded-2xl flex flex-col items-center justify-center cursor-pointer overflow-hidden group hover:border-[#007AFF] hover:bg-blue-50/10 transition relative shadow-inner">
                                    <input type="file" id="menu-image-input" class="hidden" accept="image/*">
                                    ${this.currentUploadedImageUrl 
                                        ? `<img src="${this.currentUploadedImageUrl}" id="menu-image-preview" class="w-full h-full object-cover">
                                           <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold gap-1.5 transition">
                                               <i class="fas fa-camera"></i> เปลี่ยนรูปภาพ
                                           </div>`
                                        : `<div class="text-center p-4" id="menu-image-placeholder">
                                               <div class="w-11 h-11 rounded-full bg-white border border-gray-150 flex items-center justify-center text-gray-400 mx-auto mb-2 group-hover:bg-[#E3F2FD] group-hover:text-[#007AFF] transition">
                                                   <i class="fas fa-cloud-upload-alt text-base"></i>
                                               </div>
                                               <span class="text-xs font-bold text-gray-700 block">คลิกเพื่อเลือกหรืออัปโหลดรูปภาพ</span>
                                               <span class="text-[9px] text-gray-400 mt-1 block">แนะนำขนาดสัดส่วน 4:3 (JPG, PNG, WEBP)</span>
                                           </div>
                                           <img src="" id="menu-image-preview" class="w-full h-full object-cover hidden">`
                                    }
                                </div>
                                <input type="hidden" id="menu-image-url" />
                            </div>

                            <!-- Input Form Fields -->
                            <div class="grid grid-cols-1 gap-3">
                                <div>
                                    <label class="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">ชื่อไทย</label>
                                    <input type="text" id="m-name-th" class="w-full rounded-xl border border-gray-200/80 bg-white px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-[#007AFF] focus:ring-0 focus:outline-none transition" placeholder="เช่น: ข้าวผัดปู" value="${editingItem ? editingItem.name_th : ''}">
                                </div>
                                <div>
                                    <label class="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">ชื่ออังกฤษ</label>
                                    <input type="text" id="m-name-en" class="w-full rounded-xl border border-gray-200/80 bg-white px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-[#007AFF] focus:ring-0 focus:outline-none transition" placeholder="เช่น: Crab Fried Rice" value="${editingItem ? (editingItem.name_en || '') : ''}">
                                </div>
                                <div class="grid grid-cols-2 gap-3">
                                    <div>
                                        <label class="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">ราคา (บาท)</label>
                                        <input type="number" id="m-price" min="0.01" step="0.01" class="w-full rounded-xl border border-gray-200/80 bg-white px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-[#007AFF] focus:ring-0 focus:outline-none transition" placeholder="95.00" value="${editingItem ? Utils.centsToBaht(editingItem.base_price_cents) : ''}">
                                    </div>
                                    <div>
                                        <label class="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">หมวดหมู่</label>
                                        <select id="m-cat" class="w-full rounded-xl border border-gray-200/80 bg-white px-3 py-2.5 text-sm text-gray-800 focus:border-[#007AFF] focus:ring-0 focus:outline-none transition">
                                            ${this.categories.map(c => `
                                                <option value="${c.id}" ${editingItem && editingItem.category_id === c.id ? 'selected' : ''}>${c.name_th}</option>
                                            `).join('')}
                                            ${this.categories.length === 0 ? '<option value="">ไม่มีหมวดหมู่</option>' : ''}
                                        </select>
                                    </div>
                                </div>
                                <div class="flex items-center py-1">
                                    <input type="checkbox" id="m-sold-out" class="h-4.5 w-4.5 text-[#007AFF] border-gray-300 rounded focus:ring-0 focus:outline-none" ${editingItem && editingItem.is_sold_out ? 'checked' : ''}>
                                    <label for="m-sold-out" class="ml-2 block text-xs font-bold text-gray-600 select-none cursor-pointer uppercase tracking-wider">หมดชั่วคราว (ของหมด)</label>
                                </div>
                            </div>

                            <!-- Buttons Section -->
                            <div class="flex gap-3 pt-2">
                                <button id="btn-save-menu" class="ios-action-btn ios-btn-primary flex-1 py-2.5 text-sm font-bold shadow-sm">
                                    ${editingItem ? 'บันทึกการแก้ไข' : 'เพิ่มเมนู'}
                                </button>
                                ${editingItem ? `
                                <button id="btn-delete-menu-detail" class="ios-action-btn bg-[#FFEAEA] text-[#FF3B30] border border-[#FFEAEA] hover:bg-red-100/50 py-2.5 text-sm font-bold shadow-sm px-4">
                                    <i class="fas fa-trash text-sm"></i>
                                </button>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `;

        this.container.innerHTML = html;
        const hiddenUrlInput = this.container.querySelector('#menu-image-url');
        if (hiddenUrlInput) hiddenUrlInput.value = this.currentUploadedImageUrl;
        
        // Reapply active search & category selection visuals and filter rows
        this._reapplyFilters();
        this.bindEvents(editingMenuId);
    }

    _reapplyFilters() {
        // Search Input
        const searchInput = this.container.querySelector('#menu-search');
        if (searchInput) searchInput.value = this.searchTerm;

        // Category Chip Highlight
        const chips = this.container.querySelectorAll('.category-chip');
        chips.forEach(chip => {
            if (chip.dataset.id === this.selectedCategory) {
                chip.classList.remove('bg-white', 'text-gray-600', 'border-gray-200/80');
                chip.classList.add('bg-[#007AFF]', 'text-white');
            } else {
                chip.classList.remove('bg-[#007AFF]', 'text-white');
                chip.classList.add('bg-white', 'text-gray-600', 'border-gray-200/80');
            }
        });

        // Filter Rows
        this.filterAndShowItems();
    }

    filterAndShowItems() {
        const rows = this.container.querySelectorAll('.menu-item-row');
        rows.forEach(row => {
            const nameTh = row.dataset.nameTh || '';
            const nameEn = row.dataset.nameEn || '';
            const categoryId = row.dataset.categoryId || '';

            const matchesSearch = !this.searchTerm || 
                                  nameTh.includes(this.searchTerm) || 
                                  nameEn.includes(this.searchTerm);

            const matchesCategory = this.selectedCategory === 'all' || 
                                    categoryId === this.selectedCategory;

            if (matchesSearch && matchesCategory) {
                row.classList.remove('hidden');
            } else {
                row.classList.add('hidden');
            }
        });
    }

    bindEvents(editingMenuId = null) {
        // Search Input change
        const searchInput = this.container.querySelector('#menu-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchTerm = e.target.value.toLowerCase().trim();
                this.filterAndShowItems();
            });
        }

        // Category Chips click
        const chips = this.container.querySelectorAll('.category-chip');
        chips.forEach(chip => {
            chip.addEventListener('click', (e) => {
                chips.forEach(c => c.classList.remove('bg-[#007AFF]', 'text-white'));
                chips.forEach(c => c.classList.add('bg-white', 'text-gray-600', 'border-gray-200/80'));

                chip.classList.remove('bg-white', 'text-gray-600', 'border-gray-200/80');
                chip.classList.add('bg-[#007AFF]', 'text-white');

                this.selectedCategory = chip.dataset.id;
                this.filterAndShowItems();
            });
        });

        // Image Drag & Drop / Click Upload
        const dropzone = this.container.querySelector('#menu-image-dropzone');
        const fileInput = this.container.querySelector('#menu-image-input');
        const preview = this.container.querySelector('#menu-image-preview');
        const placeholder = this.container.querySelector('#menu-image-placeholder');

        if (dropzone && fileInput) {
            dropzone.addEventListener('click', () => fileInput.click());

            // Prevent browser opening drop files
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                dropzone.addEventListener(eventName, (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                }, false);
            });

            // Highlight dropzone
            ['dragenter', 'dragover'].forEach(eventName => {
                dropzone.addEventListener(eventName, () => {
                    dropzone.classList.add('border-[#007AFF]', 'bg-blue-50/20');
                }, false);
            });

            ['dragleave', 'drop'].forEach(eventName => {
                dropzone.addEventListener(eventName, () => {
                    dropzone.classList.remove('border-[#007AFF]', 'bg-blue-50/20');
                }, false);
            });

            // Handle dropped file
            dropzone.addEventListener('drop', async (e) => {
                const dt = e.dataTransfer;
                const file = dt.files[0];
                if (file && file.type.startsWith('image/')) {
                    await uploadAndSetImage(file);
                }
            });

            const uploadAndSetImage = async (file) => {
                // Validate file type
                if (!file.type.startsWith('image/')) {
                    alert('ไฟล์ต้องเป็นรูปภาพประเภท JPG, PNG, หรือ WEBP');
                    return;
                }

                // Show loading placeholder
                if (placeholder) placeholder.classList.add('hidden');
                if (preview) {
                    preview.classList.remove('hidden');
                    preview.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=10&h=10&fit=crop'; // loading indicator style
                    preview.style.opacity = '0.4';
                }

                try {
                    // Compress image client-side automatically
                    console.log('[AdminMenuView] Compressing selected file:', file.name, 'size:', file.size);
                    const compressedFile = await Utils.compressImage(file, {
                        maxWidth: 1200,
                        maxHeight: 1200,
                        quality: 0.82
                    });
                    console.log('[AdminMenuView] Compression returned file:', compressedFile.name, 'size:', compressedFile.size, 'type:', compressedFile.type);

                    const maxSize = 2 * 1024 * 1024; // 2MB
                    if (compressedFile.size > maxSize) {
                        throw new Error(`ขนาดไฟล์รูปภาพใหญ่เกินกว่า 2 MB แม้ว่าจะผ่านการบีบอัดแล้ว (${Math.round(compressedFile.size / 1024 / 1024 * 100) / 100} MB)`);
                    }

                    const ext = compressedFile.name.split('.').pop();
                    const filename = `menu_${Date.now()}.${ext}`;
                    console.log('[AdminMenuView] Uploading to Supabase bucket:', STORAGE_BUCKET, 'filename:', filename);

                    const { data: uploadData, error: uploadError } = await supabase.storage
                        .from(STORAGE_BUCKET)
                        .upload(filename, compressedFile, { upsert: true, contentType: compressedFile.type });

                    if (uploadError) throw uploadError;

                    const { data: urlData } = supabase.storage
                        .from(STORAGE_BUCKET)
                        .getPublicUrl(filename);

                    const publicUrl = urlData.publicUrl;
                    this.currentUploadedImageUrl = publicUrl;
                    // Sync hidden input
                    const hiddenUrlInput = this.container.querySelector('#menu-image-url');
                    if (hiddenUrlInput) hiddenUrlInput.value = publicUrl;

                    if (preview) {
                        preview.src = publicUrl;
                        preview.style.opacity = '1';
                    }
                } catch (err) {
                    console.error("Menu image upload failed:", err);
                    alert("อัปโหลดรูปภาพอาหารไม่สำเร็จ: " + err.message);
                    if (placeholder) placeholder.classList.remove('hidden');
                    if (preview) preview.classList.add('hidden');
                }
            };

            fileInput.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (file) {
                    await uploadAndSetImage(file);
                }
            });
        }

        // Manage Categories Button click
        const btnManageCategories = this.container.querySelector('#btn-manage-categories');
        if (btnManageCategories) {
            btnManageCategories.addEventListener('click', () => {
                this.showCategoriesModal();
            });
        }

        // Cancel / Back to New Mode button clicks
        const btnCancel = this.container.querySelector('#btn-cancel-menu');
        const btnCancelText = this.container.querySelector('#btn-cancel-edit-text');
        [btnCancel, btnCancelText].forEach(btn => {
            if (btn) {
                btn.addEventListener('click', () => {
                    if (this.onCancelEditCallback) {
                        this.onCancelEditCallback();
                    }
                });
            }
        });

        const btnAddNew = this.container.querySelector('#btn-add-new-trigger');
        if (btnAddNew) {
            btnAddNew.addEventListener('click', () => {
                if (this.onCancelEditCallback) {
                    this.onCancelEditCallback();
                }
            });
        }

        // Save button click
        const btnSave = this.container.querySelector('#btn-save-menu');
        if (btnSave) {
            btnSave.addEventListener('click', () => {
                const nameTh = this.container.querySelector('#m-name-th').value.trim();
                const nameEn = this.container.querySelector('#m-name-en').value.trim();
                const priceInput = this.container.querySelector('#m-price');
                const price = Number(priceInput.value) || 0;
                const categorySelect = this.container.querySelector('#m-cat');
                const categoryId = categorySelect ? categorySelect.value : null;
                const isSoldOut = this.container.querySelector('#m-sold-out').checked;

                if (!nameTh) {
                    alert('กรุณากรอกชื่อไทย');
                    return;
                }
                if (price <= 0) {
                    alert('กรุณากรอกราคาที่มากกว่า 0');
                    return;
                }
                if (!categoryId) {
                    alert('กรุณาเลือกหมวดหมู่');
                    return;
                }

                if (this.onSaveMenuCallback) {
                    this.onSaveMenuCallback({
                        name_th: nameTh,
                        name_en: nameEn,
                        base_price_cents: Math.round(price * 100),
                        category_id: categoryId,
                        is_sold_out: isSoldOut,
                        image_url: this.currentUploadedImageUrl
                    }, editingMenuId);
                }
            });
        }

        // Row clicking selects item (on Thumbnail or Details clicks)
        const selectAreas = this.container.querySelectorAll('[data-action="select-item"]');
        selectAreas.forEach(area => {
            area.addEventListener('click', (e) => {
                const id = area.dataset.id;
                if (this.onEditMenuCallback) {
                    this.onEditMenuCallback(id);
                    // On mobile, scroll editor panel into view
                    document.getElementById('editor-panel-anchor')?.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });

        // Quick Toggle Available / Sold Out Status
        const soldOutToggles = this.container.querySelectorAll('[data-action="toggle-soldout"]');
        soldOutToggles.forEach(toggle => {
            toggle.addEventListener('change', (e) => {
                const id = toggle.dataset.id;
                const isSoldOut = !toggle.checked;

                // Dynamically toggle the UI badge instantly without re-rendering
                const badge = this.container.querySelector(`#soldout-badge-${id}`);
                if (badge) {
                    if (isSoldOut) {
                        badge.classList.remove('hidden');
                    } else {
                        badge.classList.add('hidden');
                    }
                }

                // Call App controller to update Supabase
                if (this.onToggleSoldOutCallback) {
                    this.onToggleSoldOutCallback(id, isSoldOut);
                }
            });
        });

        // Delete buttons click
        const deleteBtns = this.container.querySelectorAll('[data-action="delete-menu"]');
        deleteBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = btn.dataset.id;
                if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบเมนูนี้?')) {
                    if (this.onDeleteMenuCallback) {
                        this.onDeleteMenuCallback(id);
                    }
                }
            });
        });

        // Editor detail Delete button click
        const btnDeleteDetail = this.container.querySelector('#btn-delete-menu-detail');
        if (btnDeleteDetail && editingMenuId) {
            btnDeleteDetail.addEventListener('click', () => {
                if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบเมนูนี้?')) {
                    if (this.onDeleteMenuCallback) {
                        this.onDeleteMenuCallback(editingMenuId);
                    }
                }
            });
        }
    }

    showCategoriesModal() {
        const modal = document.getElementById('custom-modal');
        const title = document.getElementById('modal-title');
        const message = document.getElementById('modal-message');
        const btnConfirm = document.getElementById('modal-confirm-btn');
        const btnCancel = document.getElementById('modal-cancel-btn');

        if (!modal) return;

        title.textContent = 'จัดการหมวดหมู่เมนู';
        btnCancel.classList.remove('hidden');
        btnCancel.textContent = 'ปิด';
        btnConfirm.classList.add('hidden'); // Changes saved inline, confirm button not needed
        
        message.innerHTML = `
            <div class="w-full bg-white flex flex-col">
                <!-- Add Form -->
                <div class="p-4 bg-white border-b border-gray-150 flex flex-col gap-3 text-left">
                    <div class="text-xs font-bold text-gray-400 uppercase tracking-wider">เพิ่มหมวดหมู่ใหม่</div>
                    <div class="grid grid-cols-2 gap-2">
                        <div>
                            <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">ชื่อภาษาไทย</label>
                            <input type="text" id="new-cat-name-th" class="w-full rounded-xl border border-gray-200/80 bg-[#F2F2F7] px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#007AFF] transition" placeholder="เช่น อาหารจานเดียว">
                        </div>
                        <div>
                            <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">ชื่อภาษาอังกฤษ</label>
                            <input type="text" id="new-cat-name-en" class="w-full rounded-xl border border-gray-200/80 bg-[#F2F2F7] px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#007AFF] transition" placeholder="เช่น Main Dishes">
                        </div>
                    </div>
                    <div class="flex gap-2 items-end">
                        <div class="flex-shrink-0">
                            <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">ลำดับแสดงผล</label>
                            <input type="number" id="new-cat-sort" class="w-20 rounded-xl border border-gray-200/80 bg-[#F2F2F7] px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#007AFF] transition text-center" placeholder="ลำดับ" value="${this.categories.length + 1}">
                        </div>
                        <button id="btn-add-category-modal" class="flex-grow bg-[#34C759] hover:bg-green-600 text-white font-bold rounded-xl text-xs py-3.5 shadow-sm transition flex items-center justify-center gap-1">
                            <i class="fas fa-plus"></i> เพิ่มหมวดหมู่
                        </button>
                    </div>
                </div>

                <!-- Categories list -->
                <div class="w-full bg-[#F2F2F7] p-4 flex flex-col gap-2 max-h-[40vh] overflow-y-auto custom-scroll text-left">
                    <div class="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">หมวดหมู่ทั้งหมด (${this.categories.length})</div>
                    ${this.categories.length === 0 
                        ? `<div class="text-center text-gray-400 py-6 text-xs italic bg-white border border-gray-100 rounded-xl">ยังไม่มีหมวดหมู่</div>`
                        : this.categories.map(c => `
                            <div class="bg-white p-3.5 border border-gray-100 rounded-xl flex justify-between items-center gap-3">
                                <div class="flex-grow min-w-0">
                                    <div class="font-bold text-gray-900 text-sm truncate">${c.name_th}</div>
                                    <div class="text-xs text-gray-400 mt-0.5 truncate">${c.name_en || '-'} (ลำดับ: ${c.sort_order || 0})</div>
                                </div>
                                <button data-action="delete-category" data-id="${c.id}" class="text-gray-400 hover:text-[#FF3B30] p-2 hover:bg-[#FFEAEA] rounded-xl transition shrink-0">
                                    <i class="fas fa-trash-alt text-xs pointer-events-none"></i>
                                </button>
                            </div>
                        `).join('')}
                </div>
            </div>
        `;

        this.bindCategoryModalEvents();
        modal.classList.remove('hidden');
    }

    bindCategoryModalEvents() {
        const modal = document.getElementById('custom-modal');
        if (!modal) return;

        // Add Button
        const btnAdd = modal.querySelector('#btn-add-category-modal');
        if (btnAdd) {
            btnAdd.addEventListener('click', () => {
                const nameTh = modal.querySelector('#new-cat-name-th').value.trim();
                const nameEn = modal.querySelector('#new-cat-name-en').value.trim();
                const sortOrder = modal.querySelector('#new-cat-sort').value;

                if (!nameTh) {
                    alert('กรุณากรอกชื่อไทยของหมวดหมู่');
                    return;
                }

                if (this.onSaveCategoryCallback) {
                    this.onSaveCategoryCallback({
                        name_th: nameTh,
                        name_en: nameEn,
                        sort_order: sortOrder
                    });
                }
            });
        }

        // Delete Buttons
        const deleteBtns = modal.querySelectorAll('[data-action="delete-category"]');
        deleteBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = btn.dataset.id;
                if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบหมวดหมู่ย่อยนี้? (รายการอาหารภายใต้หมวดหมู่นี้จะไม่ถูกลบ แต่อาจไม่แสดงหมวดหมู่ในการกรอง)')) {
                    if (this.onDeleteCategoryCallback) {
                        this.onDeleteCategoryCallback(id);
                    }
                }
            });
        });
    }
}
