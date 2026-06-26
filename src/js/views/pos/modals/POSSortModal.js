import { posService } from '../../../services/POSService.js';
import Sortable from 'sortablejs';
import { Utils } from '../../../utils.js';

export class POSSortModal {
    static open(menuTree, onSave) {
        // Extract unique categories and group menu items under them
        const categoriesMap = {};
        menuTree.forEach(item => {
            const cat = item.categories;
            const catId = cat?.id || 'others';
            if (!categoriesMap[catId]) {
                categoriesMap[catId] = {
                    id: catId,
                    name_th: cat?.name_th || 'อื่นๆ',
                    sort_order: cat?.sort_order !== undefined ? cat.sort_order : 999,
                    items: []
                };
            }
            categoriesMap[catId].items.push(item);
        });

        // Sort categories by current sort_order
        const categoriesList = Object.values(categoriesMap).sort((a, b) => a.sort_order - b.sort_order);

        // Sort items within each category by current sort_order
        categoriesList.forEach(cat => {
            cat.items.sort((a, b) => (a.sort_order !== undefined ? a.sort_order : 999) - (b.sort_order !== undefined ? b.sort_order : 999));
        });

        if (categoriesList.length === 0) {
            alert('ไม่พบหมวดหมู่สินค้าสำหรับการจัดเรียง');
            return;
        }

        const modal = document.getElementById('custom-modal');
        const wrapper = document.getElementById('modal-content-wrapper');
        const title = document.getElementById('modal-title');
        const message = document.getElementById('modal-message');
        const btnConfirm = document.getElementById('modal-confirm-btn');
        const btnCancel = document.getElementById('modal-cancel-btn');
        if (!modal || !wrapper) return;

        title.textContent = 'ตั้งค่าการจัดเรียงหน้าร้าน';
        btnCancel.classList.remove('hidden');
        btnCancel.textContent = 'ยกเลิก';
        btnConfirm.textContent = 'บันทึกการจัดเรียง';

        let activeTab = 'categories'; // 'categories' | 'items'
        let categorySortable = null;
        let itemSortables = [];

        const originalWrapperClass = 'ios-modal-content overflow-hidden w-full max-w-md flex flex-col max-h-[90vh] relative transition-all';

        const updateModalSize = (tab) => {
            if (tab === 'items') {
                wrapper.className = 'ios-modal-content overflow-hidden w-full max-w-5xl flex flex-col max-h-[90vh] relative transition-all';
            } else {
                wrapper.className = originalWrapperClass;
            }
        };

        const closeModal = () => {
            wrapper.className = originalWrapperClass;
            modal.classList.add('hidden');
            if (categorySortable) categorySortable.destroy();
            itemSortables.forEach(s => s.destroy());
        };

        // Intercept close button (X) click on modal
        const btnCloseX = modal.querySelector('button[onclick*="custom-modal"]');
        if (btnCloseX) {
            btnCloseX.removeAttribute('onclick');
            btnCloseX.onclick = () => {
                closeModal();
            };
        }

        // Save current DOM state into in-memory data structures
        const saveDOMState = () => {
            if (activeTab === 'categories') {
                const categoryListEl = document.getElementById('category-sort-list');
                if (categoryListEl) {
                    const orderedIds = Array.from(categoryListEl.children).map(li => li.dataset.id);
                    categoriesList.sort((a, b) => orderedIds.indexOf(a.id) - orderedIds.indexOf(b.id));
                }
            } else if (activeTab === 'items') {
                const columnLists = document.querySelectorAll('.kanban-board-column-list');
                if (columnLists.length > 0) {
                    columnLists.forEach(col => {
                        const targetCatId = col.dataset.categoryId;
                        const itemIds = Array.from(col.children).map(card => card.dataset.id);
                        
                        itemIds.forEach((itemId, idx) => {
                            const foundItem = menuTree.find(m => m.id === itemId);
                            if (foundItem) {
                                if (!foundItem.categories) foundItem.categories = {};
                                foundItem.categories.id = targetCatId;
                                foundItem.category_id = targetCatId === 'others' ? null : targetCatId;
                                foundItem.sort_order = idx + 1;
                            }
                        });
                    });
                    
                    // Re-sync categoriesList items with updated menuTree state
                    categoriesList.forEach(cat => {
                        cat.items = menuTree.filter(item => {
                            const itemCatId = item.categories?.id || 'others';
                            return itemCatId === cat.id;
                        }).sort((a, b) => (a.sort_order || 999) - (b.sort_order || 999));
                    });
                }
            }
        };

        const renderModalBody = () => {
            // Destroy existing Sortable instances
            if (categorySortable) {
                categorySortable.destroy();
                categorySortable = null;
            }
            itemSortables.forEach(s => s.destroy());
            itemSortables = [];

            updateModalSize(activeTab);

            let bodyHtml = '';

            const tabsHtml = `
                <div class="p-3 bg-[#F2F2F7] border-b border-gray-200 sticky top-0 z-10 w-full shrink-0">
                    <div class="ios-segmented-control">
                        <button type="button" id="tab-btn-categories" class="ios-segmented-item ${activeTab === 'categories' ? 'active' : ''}">
                            <i class="fas fa-folder"></i> <span>จัดเรียงหมวดหมู่</span>
                        </button>
                        <button type="button" id="tab-btn-items" class="ios-segmented-item ${activeTab === 'items' ? 'active' : ''}">
                            <i class="fas fa-utensils"></i> <span>จัดเรียงเมนู (Kanban)</span>
                        </button>
                    </div>
                </div>
            `;

            if (activeTab === 'categories') {
                const listHtml = `<ul id="category-sort-list" class="space-y-2 max-h-[350px] overflow-y-auto custom-scroll pr-1 w-full">
                    ${categoriesList.map(cat => `<li class="ios-card bg-white flex items-stretch justify-between overflow-hidden p-0" style="padding: 0 !important; cursor: default !important;" data-id="${cat.id}">
                        <span class="pointer-events-none p-3 flex-grow flex items-center text-sm font-semibold text-gray-900">${cat.name_th}</span>
                        <span class="drag-handle bg-gray-50 border-l border-gray-100 text-gray-400 hover:text-gray-600 hover:bg-gray-100 w-11 flex items-center justify-center cursor-move text-base shrink-0 transition"><i class="fas fa-bars pointer-events-none"></i></span>
                    </li>`).join('')}
                </ul>`;

                bodyHtml = `
                    <div class="flex flex-col w-full">
                        ${tabsHtml}
                        <div class="p-4 bg-[#F2F2F7] space-y-2 w-full">
                            <p class="text-[11px] font-medium text-gray-500 mb-2">ลากแถบจับเพื่อเปลี่ยนลำดับหมวดหมู่</p>
                            ${listHtml}
                        </div>
                    </div>
                `;
            } else {
                const boardHtml = `
                    <div id="kanban-board" class="kanban-board-container custom-scroll">
                        ${categoriesList.map(cat => {
                            return `
                                <div class="kanban-board-column" data-category-id="${cat.id}">
                                    <div class="kanban-board-column-header">
                                        <span class="truncate pr-1">${cat.name_th}</span>
                                        <span class="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-bold item-count-badge shrink-0">${cat.items.length}</span>
                                    </div>
                                    <div class="kanban-board-column-list custom-scroll" data-category-id="${cat.id}">
                                        ${cat.items.map(item => `
                                            <div class="ios-card bg-white flex items-stretch overflow-hidden border border-gray-200/50" style="padding: 0 !important; cursor: default !important;" data-id="${item.id}">
                                                <div class="flex-grow p-3 flex flex-col justify-between pointer-events-none min-w-0">
                                                    <div class="font-semibold text-xs text-gray-900 truncate pr-1">${item.name_th}</div>
                                                    <div class="font-bold text-xs text-[#FF9500] mt-1">${Utils.formatCurrency(item.base_price_cents)}</div>
                                                </div>
                                                <span class="drag-handle bg-gray-50 border-l border-gray-100 text-gray-400 hover:text-gray-600 hover:bg-gray-100 w-10 flex items-center justify-center cursor-move text-sm shrink-0 transition"><i class="fas fa-bars pointer-events-none"></i></span>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                `;

                bodyHtml = `
                    <div class="flex flex-col w-full h-[500px]">
                        ${tabsHtml}
                        <div class="p-4 bg-[#F2F2F7] flex flex-col flex-1 overflow-hidden">
                            <p class="text-[11px] font-medium text-gray-500 mb-3">ลากแถบจับเพื่อเรียงลำดับหรือย้ายหมวดหมู่สินค้า</p>
                            ${boardHtml}
                        </div>
                    </div>
                `;
            }

            message.innerHTML = bodyHtml;

            // Bind Tab Click Listeners
            document.getElementById('tab-btn-categories')?.addEventListener('click', () => {
                saveDOMState();
                activeTab = 'categories';
                renderModalBody();
            });
            document.getElementById('tab-btn-items')?.addEventListener('click', () => {
                saveDOMState();
                activeTab = 'items';
                renderModalBody();
            });

            // Initialize SortableJS
            if (activeTab === 'categories') {
                categorySortable = new Sortable(document.getElementById('category-sort-list'), {
                    animation: 150,
                    ghostClass: 'bg-blue-50/50',
                    handle: '.drag-handle',
                });
            } else {
                const columns = document.querySelectorAll('.kanban-board-column-list');
                columns.forEach(col => {
                    const sortable = new Sortable(col, {
                        animation: 150,
                        ghostClass: 'bg-blue-50/50',
                        dragClass: 'shadow-lg',
                        handle: '.drag-handle',
                        onEnd: () => {
                            // Update badge counters immediately on change
                            document.querySelectorAll('.kanban-board-column').forEach(columnEl => {
                                const listEl = columnEl.querySelector('.kanban-board-column-list');
                                const badgeEl = columnEl.querySelector('.item-count-badge');
                                if (listEl && badgeEl) {
                                    badgeEl.textContent = listEl.children.length;
                                }
                            });
                        }
                    });
                    itemSortables.push(sortable);
                });
            }
        };

        renderModalBody();
        modal.classList.remove('hidden');

        // Confirm saves both Category Order and Menu Items Order
        btnConfirm.onclick = async () => {
            saveDOMState();

            const spinner = document.getElementById('loading-spinner');
            spinner?.classList.remove('hidden');

            try {
                // 1. Save categories order
                const orderedCategoryIds = categoriesList.map(c => c.id);
                await posService.updateCategoryOrder(orderedCategoryIds);

                // 2. Save menu items order and category assignments
                const itemsUpdates = menuTree.map(item => ({
                    id: item.id,
                    sort_order: item.sort_order !== undefined ? item.sort_order : 999,
                    category_id: item.category_id
                }));
                await posService.updateMenuItemOrder(itemsUpdates);

                if (onSave) {
                    await onSave();
                }
            } catch (err) {
                console.error('Failed to save sorted menu state:', err);
                alert('เกิดข้อผิดพลาดในการบันทึกการจัดเรียง');
            } finally {
                spinner?.classList.add('hidden');
                closeModal();
            }
        };

        btnCancel.onclick = () => {
            closeModal();
        };
    }
}
