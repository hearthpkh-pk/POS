import { supabase } from '../core/SupabaseClient.js';
import { Utils } from '../utils.js';
import { AdminModifiersModal } from './admin/modals/AdminModifiersModal.js';
import { AdminCategoriesModal } from './admin/modals/AdminCategoriesModal.js';
import { AdminMenuEditor } from './admin/components/AdminMenuEditor.js';

export class AdminMenuView {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.categories = [];
        this.modifierGroups = [];
        this.itemModifierGroups = [];
        this.selectedCategory = 'all';
        this.editingMenuId = null;
        this.menuTree = [];

        // Callbacks
        this.onEditMenuCallback = null;
        this.onDeleteMenuCallback = null;
        this.onCancelEditCallback = null;
        this.onToggleSoldOutCallback = null;
        this.onSaveModifierGroupCallback = null;
        this.onDeleteModifierGroupCallback = null;
        this.onSaveModifierOptionCallback = null;
        this.onDeleteModifierOptionCallback = null;
        this.onToggleModifierOptionSoldOutCallback = null;
        this.onUpdateModifierOptionCallback = null;
        this.onSaveCategoryCallback = null;
        this.onDeleteCategoryCallback = null;
        this.onSaveMenuCallback = null;
    }

    setCategories(categories) {
        this.categories = categories || [];
    }

    setModifierGroups(groups) {
        this.modifierGroups = groups || [];
    }

    setItemModifierGroups(links) {
        this.itemModifierGroups = links || [];
    }

    render(menuTree = [], editingMenuId = null) {
        if (!this.container) return;

        const flatMenu = menuTree;
        this.menuTree = menuTree;
        this.editingMenuId = editingMenuId;

        const html = `
        <div class="p-4 lg:p-6 h-full overflow-y-auto custom-scroll bg-[#F2F2F7]">
            <div class="mb-6 flex justify-between items-center">
                <div>
                    <h2 class="text-xl font-bold text-gray-900 leading-tight">จัดการเมนู</h2>
                    <p class="text-xs text-gray-500 mt-1">จัดการรายการสินค้า อาหาร เครื่องดื่ม และรูปภาพประจำเมนู</p>
                </div>
            </div>

            <div class="flex flex-col gap-6">
                <!-- Search & Filter Card -->
                <div class="bg-white p-4 border border-gray-150 shadow-sm rounded-2xl">
                    <div class="relative flex items-center mb-3 gap-2">
                        <div class="relative flex-grow">
                            <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                                <i class="fas fa-search text-xs"></i>
                            </span>
                            <input type="text" id="menu-search" class="w-full bg-[#F2F2F7] rounded-xl pl-9 pr-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none transition border-none focus:ring-1 focus:ring-[#007AFF]" placeholder="ค้นหาเมนูอาหาร/เครื่องดื่ม...">
                        </div>
                        <button id="btn-add-menu-modal" class="bg-[#34C759] hover:bg-green-600 text-white px-3 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-1.5 shadow-sm shrink-0 select-none">
                            <i class="fas fa-plus"></i> <span class="hidden sm:inline">เพิ่มเมนูใหม่</span>
                        </button>
                        <button id="btn-manage-categories" class="bg-[#F2F2F7] hover:bg-gray-200 text-[#007AFF] px-3 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-1.5 shadow-sm border border-gray-150 shrink-0 select-none">
                            <i class="fas fa-tags text-xs"></i> <span class="hidden sm:inline">หมวดหมู่</span>
                        </button>
                        <button id="btn-manage-modifiers" class="bg-[#F2F2F7] hover:bg-gray-200 text-[#007AFF] px-3 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-1.5 shadow-sm border border-gray-150 shrink-0 select-none">
                            <i class="fas fa-sliders-h text-xs"></i> <span class="hidden sm:inline">ตัวเลือกเสริม</span>
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
                    <div class="space-y-2 max-h-[65vh] overflow-y-auto custom-scroll pr-1">
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
                                    
                                    <div class="w-12 h-12 rounded-xl bg-gray-100 border border-gray-100 overflow-hidden flex items-center justify-center shrink-0 mr-3.5 cursor-pointer" data-action="select-item" data-id="${item.id}">
                                        ${hasImage 
                                            ? `<img src="${item.image_url}" class="w-full h-full object-cover">` 
                                            : `<i class="fas fa-burger text-gray-300 text-sm"></i>`
                                        }
                                    </div>
                                    
                                    <div class="flex-grow min-w-0 mr-3 cursor-pointer" data-action="select-item" data-id="${item.id}">
                                        <div class="font-bold text-gray-900 text-sm truncate flex items-center gap-1.5">
                                            <span>${item.name_th}</span>
                                            <span class="text-[10px] text-gray-400 font-normal">(${item.categories?.name_th || 'N/A'})</span>
                                        </div>
                                        <div class="text-xs text-gray-500 font-semibold mt-0.5">ราคา: ${Utils.formatCurrency(item.base_price_cents)}</div>
                                        <div class="mt-1 flex items-center gap-1.5">
                                            <span id="soldout-badge-${item.id}" class="soldout-badge ${item.is_sold_out ? '' : 'hidden'} bg-[#FFEAEA] text-[#FF3B30] text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 border border-[#FFEAEA]">
                                                <i class="fas fa-exclamation-circle"></i> ของหมดชั่วคราว
                                            </span>
                                        </div>
                                    </div>

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
        </div>
        `;

        this.container.innerHTML = html;

        this._reapplyFilters();
        this.bindEvents();
    }

    _reapplyFilters() {
        const searchInput = this.container.querySelector('#menu-search');
        if (searchInput) searchInput.value = this.searchTerm;

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

    bindEvents() {
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

        // Manage Categories Button click
        const btnManageCategories = this.container.querySelector('#btn-manage-categories');
        if (btnManageCategories) {
            btnManageCategories.addEventListener('click', () => {
                this.showCategoriesModal();
            });
        }

        // Manage Modifiers Button click
        const btnManageModifiers = this.container.querySelector('#btn-manage-modifiers');
        if (btnManageModifiers) {
            btnManageModifiers.addEventListener('click', () => {
                this.showModifiersModal();
            });
        }

        // Add Menu modal trigger button
        const btnAddMenuModal = this.container.querySelector('#btn-add-menu-modal');
        if (btnAddMenuModal) {
            btnAddMenuModal.addEventListener('click', () => {
                this.showMenuEditorModal(null);
            });
        }

        // Items select click — opens editor modal
        const itemRows = this.container.querySelectorAll('.menu-item-row');
        itemRows.forEach(row => {
            const id = row.dataset.id;
            const selectEls = row.querySelectorAll('[data-action="select-item"]');
            selectEls.forEach(el => {
                el.addEventListener('click', () => {
                    const item = this.menuTree.find(m => m.id === id);
                    if (item) {
                        this.showMenuEditorModal(item);
                    }
                });
            });

            // Toggle Soldout Switch
            const soldoutToggle = row.querySelector('[data-action="toggle-soldout"]');
            if (soldoutToggle) {
                soldoutToggle.addEventListener('change', () => {
                    const isSoldOut = !soldoutToggle.checked;
                    const badge = this.container.querySelector(`#soldout-badge-${id}`);
                    if (badge) {
                        if (isSoldOut) badge.classList.remove('hidden');
                        else badge.classList.add('hidden');
                    }
                    if (this.onToggleSoldOutCallback) {
                        this.onToggleSoldOutCallback(id, isSoldOut);
                    }
                });
            }

            // Quick Delete Button click
            const btnDelete = row.querySelector('[data-action="delete-menu"]');
            if (btnDelete) {
                btnDelete.addEventListener('click', () => {
                    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบเมนูอาหารนี้?')) {
                        if (this.onDeleteMenuCallback) {
                            this.onDeleteMenuCallback(id);
                        }
                    }
                });
            }
        });
    }

    showMenuEditorModal(editingItem = null) {
        const modal = document.getElementById('custom-modal');
        const title = document.getElementById('modal-title');
        const message = document.getElementById('modal-message');
        const btnConfirm = document.getElementById('modal-confirm-btn');
        const btnCancel = document.getElementById('modal-cancel-btn');

        if (!modal) return;

        title.textContent = editingItem ? 'แก้ไขข้อมูลเมนู' : 'เพิ่มเมนูใหม่';
        btnCancel.classList.add('hidden');
        btnConfirm.classList.add('hidden');

        message.innerHTML = `<div class="w-full bg-[#F2F2F7] max-h-[70vh] overflow-y-auto custom-scroll p-4 text-left" id="editor-modal-anchor"></div>`;
        const anchor = message.querySelector('#editor-modal-anchor');

        AdminMenuEditor.render(
            anchor,
            this.categories,
            this.modifierGroups,
            this.itemModifierGroups,
            editingItem,
            {
                onSave: (menuData, editingMenuId) => {
                    modal.classList.add('hidden');
                    if (this.onSaveMenuCallback) this.onSaveMenuCallback(menuData, editingMenuId);
                },
                onCancel: () => {
                    modal.classList.add('hidden');
                    if (this.onCancelEditCallback) this.onCancelEditCallback();
                },
                onDelete: (id) => {
                    modal.classList.add('hidden');
                    if (this.onDeleteMenuCallback) this.onDeleteMenuCallback(id);
                }
            }
        );

        modal.classList.remove('hidden');
    }

    showCategoriesModal() {
        AdminCategoriesModal.show(this.categories, {
            onSave: (catData) => { if (this.onSaveCategoryCallback) this.onSaveCategoryCallback(catData); },
            onDelete: (id) => { if (this.onDeleteCategoryCallback) this.onDeleteCategoryCallback(id); }
        });
    }

    showModifiersModal() {
        AdminModifiersModal.show(this.modifierGroups, {
            onSaveGroup: (groupData) => { if (this.onSaveModifierGroupCallback) this.onSaveModifierGroupCallback(groupData); },
            onDeleteGroup: (id) => { if (this.onDeleteModifierGroupCallback) this.onDeleteModifierGroupCallback(id); },
            onSaveOption: (optionData) => { if (this.onSaveModifierOptionCallback) this.onSaveModifierOptionCallback(optionData); },
            onDeleteOption: (id, groupId) => { if (this.onDeleteModifierOptionCallback) this.onDeleteModifierOptionCallback(id, groupId); },
            onToggleOptionSoldOut: (id, isSoldOut, groupId) => { if (this.onToggleModifierOptionSoldOutCallback) this.onToggleModifierOptionSoldOutCallback(id, isSoldOut, groupId); },
            onUpdateOption: (id, updateData, groupId) => { if (this.onUpdateModifierOptionCallback) this.onUpdateModifierOptionCallback(id, updateData, groupId); }
        });
    }

    showModifierOptionsModal(groupId) {
        AdminModifiersModal.showModifierOptionsModal(groupId, this.modifierGroups, {
            onSaveGroup: (groupData) => { if (this.onSaveModifierGroupCallback) this.onSaveModifierGroupCallback(groupData); },
            onDeleteGroup: (id) => { if (this.onDeleteModifierGroupCallback) this.onDeleteModifierGroupCallback(id); },
            onSaveOption: (optionData) => { if (this.onSaveModifierOptionCallback) this.onSaveModifierOptionCallback(optionData); },
            onDeleteOption: (id, groupId) => { if (this.onDeleteModifierOptionCallback) this.onDeleteModifierOptionCallback(id, groupId); },
            onToggleOptionSoldOut: (id, isSoldOut, groupId) => { if (this.onToggleModifierOptionSoldOutCallback) this.onToggleModifierOptionSoldOutCallback(id, isSoldOut, groupId); },
            onUpdateOption: (id, updateData, groupId) => { if (this.onUpdateModifierOptionCallback) this.onUpdateModifierOptionCallback(id, updateData, groupId); }
        });
    }
}
