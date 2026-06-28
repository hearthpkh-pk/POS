import { supabase } from '../../../core/SupabaseClient.js';
import { Utils } from '../../../utils.js';

const STORAGE_BUCKET = 'restaurant-images';

export class AdminMenuEditor {
    static render(anchor, categories, modifierGroups, itemModifierGroups, editingItem, callbacks) {
        if (!anchor) return;

        const editingMenuId = editingItem ? editingItem.id : null;
        let currentUploadedImageUrl = editingItem ? (editingItem.image_url || '') : '';

        const hasImage = !!currentUploadedImageUrl;

        const html = `
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
                            ${currentUploadedImageUrl 
                                ? `<img src="${currentUploadedImageUrl}" id="menu-image-preview" class="w-full h-full object-cover">
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
                        <input type="hidden" id="menu-image-url" value="${currentUploadedImageUrl}" />
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
                                    ${categories.map(c => `
                                        <option value="${c.id}" ${editingItem && editingItem.category_id === c.id ? 'selected' : ''}>${c.name_th}</option>
                                    `).join('')}
                                    ${categories.length === 0 ? '<option value="">ไม่มีหมวดหมู่</option>' : ''}
                                </select>
                            </div>
                        </div>
                        <div class="flex items-center py-1">
                            <input type="checkbox" id="m-sold-out" class="h-4.5 w-4.5 text-[#007AFF] border-gray-300 rounded focus:ring-0 focus:outline-none" ${editingItem && editingItem.is_sold_out ? 'checked' : ''}>
                            <label for="m-sold-out" class="ml-2 block text-xs font-bold text-gray-600 select-none cursor-pointer uppercase tracking-wider">หมดชั่วคราว (ของหมด)</label>
                        </div>
                        <div class="border-t border-gray-100 pt-3 mt-3">
                            <label class="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">กลุ่มตัวเลือกเสริมของเมนูนี้</label>
                            <div class="space-y-1.5 max-h-[150px] overflow-y-auto custom-scroll pr-1">
                                ${modifierGroups.map(group => {
                                    const isLinked = editingMenuId ? itemModifierGroups.some(link => link.menu_item_id === editingMenuId && link.modifier_group_id === group.id) : false;
                                    return `
                                        <label class="flex items-center p-2 rounded-xl bg-gray-50 hover:bg-gray-100/50 border border-gray-200 transition cursor-pointer select-none">
                                            <input type="checkbox" class="m-link-modifier-group h-4.5 w-4.5 text-[#007AFF] border-gray-300 rounded focus:ring-0 focus:outline-none" data-group-id="${group.id}" ${isLinked ? 'checked' : ''}>
                                            <span class="ml-2.5 text-xs font-bold text-gray-700">${group.name_th} (${group.name_en || '-'})</span>
                                        </label>
                                    `;
                                }).join('')}
                                ${modifierGroups.length === 0 ? '<div class="text-[10px] text-gray-400 italic text-center py-2">ยังไม่มีกลุ่มตัวเลือกเสริมส่วนกลาง</div>' : ''}
                            </div>
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
                        <button id="btn-cancel-menu" type="button" class="ios-action-btn bg-gray-200 hover:bg-gray-300 text-gray-700 py-2.5 text-sm font-bold shadow-sm px-4 rounded-xl transition">
                            ยกเลิก
                        </button>
                    </div>
                </div>
            </div>
        `;

        anchor.innerHTML = html;
        AdminMenuEditor.bindEvents(anchor, editingMenuId, currentUploadedImageUrl, callbacks);
    }

    static bindEvents(anchor, editingMenuId, initialImageUrl, callbacks) {
        let currentImageUrl = initialImageUrl;



        // Image Drag & Drop / Click Upload
        const dropzone = anchor.querySelector('#menu-image-dropzone');
        const fileInput = anchor.querySelector('#menu-image-input');
        const preview = anchor.querySelector('#menu-image-preview');
        const placeholder = anchor.querySelector('#menu-image-placeholder');

        if (dropzone && fileInput) {
            dropzone.addEventListener('click', () => fileInput.click());

            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                dropzone.addEventListener(eventName, (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                }, false);
            });

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

            dropzone.addEventListener('drop', async (e) => {
                const dt = e.dataTransfer;
                const file = dt.files[0];
                if (file && file.type.startsWith('image/')) {
                    await uploadAndSetImage(file);
                }
            });

            const uploadAndSetImage = async (file) => {
                if (!file.type.startsWith('image/')) {
                    alert('ไฟล์ต้องเป็นรูปภาพประเภท JPG, PNG, หรือ WEBP');
                    return;
                }

                if (placeholder) placeholder.classList.add('hidden');
                if (preview) {
                    preview.classList.remove('hidden');
                    preview.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=10&h=10&fit=crop';
                    preview.style.opacity = '0.4';
                }

                try {
                    console.log('[AdminMenuEditor] Compressing file:', file.name, 'size:', file.size);
                    const compressedFile = await Utils.compressImage(file, {
                        maxWidth: 1200,
                        maxHeight: 1200,
                        quality: 0.82
                    });
                    console.log('[AdminMenuEditor] Compression done:', compressedFile.size);

                    const maxSize = 2 * 1024 * 1024;
                    if (compressedFile.size > maxSize) {
                        throw new Error(`ขนาดไฟล์รูปภาพใหญ่เกินกว่า 2 MB แม้ว่าจะผ่านการบีบอัดแล้ว`);
                    }

                    const ext = compressedFile.name.split('.').pop();
                    const filename = `menu_${Date.now()}.${ext}`;

                    const { error: uploadError } = await supabase.storage
                        .from(STORAGE_BUCKET)
                        .upload(filename, compressedFile, { upsert: true, contentType: compressedFile.type });

                    if (uploadError) throw uploadError;

                    const { data: urlData } = supabase.storage
                        .from(STORAGE_BUCKET)
                        .getPublicUrl(filename);

                    currentImageUrl = urlData.publicUrl;
                    const hiddenUrlInput = anchor.querySelector('#menu-image-url');
                    if (hiddenUrlInput) hiddenUrlInput.value = currentImageUrl;

                    if (preview) {
                        preview.src = currentImageUrl;
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

        // Cancel button click
        const btnCancel = anchor.querySelector('#btn-cancel-menu');
        if (btnCancel && callbacks.onCancel) {
            btnCancel.addEventListener('click', () => callbacks.onCancel());
        }

        // Delete Menu Detail button
        const btnDeleteDetail = anchor.querySelector('#btn-delete-menu-detail');
        if (btnDeleteDetail && editingMenuId && callbacks.onDelete) {
            btnDeleteDetail.addEventListener('click', () => {
                if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบเมนูอาหารนี้?')) {
                    callbacks.onDelete(editingMenuId);
                }
            });
        }

        // Save menu button
        const btnSave = anchor.querySelector('#btn-save-menu');
        if (btnSave && callbacks.onSave) {
            btnSave.addEventListener('click', () => {
                const nameTh = anchor.querySelector('#m-name-th').value.trim();
                const nameEn = anchor.querySelector('#m-name-en').value.trim();
                const priceInput = anchor.querySelector('#m-price');
                const price = Number(priceInput.value) || 0;
                const categorySelect = anchor.querySelector('#m-cat');
                const categoryId = categorySelect ? categorySelect.value : null;
                const isSoldOut = anchor.querySelector('#m-sold-out').checked;

                if (!nameTh) return alert('กรุณากรอกชื่อไทย');
                if (!categoryId) return alert('กรุณาเลือกหมวดหมู่');

                const basePriceCents = Math.round(price * 100);

                if (price <= 0) {
                    return alert('กรุณากรอกราคาที่มากกว่า 0');
                }

                const linkedCheckboxes = anchor.querySelectorAll('.m-link-modifier-group:checked');
                const linkedGroupIds = Array.from(linkedCheckboxes).map(cb => cb.dataset.groupId);

                callbacks.onSave({
                    name_th: nameTh,
                    name_en: nameEn,
                    base_price_cents: basePriceCents,
                    category_id: categoryId,
                    is_sold_out: isSoldOut,
                    image_url: currentImageUrl,
                    variants: null,
                    linked_group_ids: linkedGroupIds
                }, editingMenuId);
            });
        }
    }
}
