import { posService } from '../../../services/POSService.js';
import Sortable from 'sortablejs';
import { Utils } from '../../../utils.js';

export class POSMenuPanel {
    static getHTML(menuTree, isSortingMenuItems) {
        if (menuTree.length === 0) {
            return '<div class="text-center text-gray-500 py-10">ไม่พบรายการเมนู<br>โปรดเพิ่มเมนูใหม่ในหน้า "จัดการเมนู"</div>';
        }
        // Group items by category
        const categoriesMap = {};
        menuTree.forEach(item => {
            const catId = item.categories?.id || 'others';
            const catName = item.categories?.name_th || 'อื่นๆ';
            const sortOrder = item.categories?.sort_order !== undefined ? item.categories.sort_order : 999;
            if (!categoriesMap[catId]) {
                categoriesMap[catId] = { id: catId, name: catName, sort_order: sortOrder, items: [] };
            }
            categoriesMap[catId].items.push(item);
        });
        const sortedCategories = Object.values(categoriesMap).sort((a, b) => a.sort_order - b.sort_order);
        const sortMenuItemsText = isSortingMenuItems ? 'บันทึกการจัดเรียง' : 'จัดเรียงเมนูรายชิ้น';
        const sortMenuItemsIcon = isSortingMenuItems ? 'fa-check' : 'fa-sort';
        const sortMenuItemsClass = isSortingMenuItems
            ? 'ios-btn-success text-white'
            : 'ios-btn-secondary';
        const infoText = isSortingMenuItems
            ? 'โหมดจัดเรียงเมนูรายชิ้น: ลากแถบจับทางด้านขวาของการ์ดเพื่อเปลี่ยนตำแหน่งลำดับสินค้า'
            : 'จัดเรียงเมนูหน้าร้านและฝั่งลูกค้า';
        const headerHtml = `
            <div class="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-4 bg-white p-3 rounded-xl border border-gray-200/50 shadow-sm">
                <span class="text-xs text-gray-500 font-medium flex items-center gap-1.5"><i class="fas fa-info-circle text-[#007AFF]"></i> <span>${infoText}</span></span>
                <div class="flex space-x-2 shrink-0">
                    <button id="btn-sort-menu-items" class="ios-action-btn font-semibold text-xs flex items-center gap-1 px-3 py-2 rounded-lg transition ${sortMenuItemsClass}">
                        <i class="fas ${sortMenuItemsIcon}"></i> <span>${sortMenuItemsText}</span>
                    </button>
                    <button id="btn-sort-settings" title="ตั้งค่าการจัดเรียง" class="ios-action-btn ios-btn-secondary font-semibold text-xs flex items-center gap-1 px-3 py-2 rounded-lg transition">
                        <i class="fas fa-cog"></i> <span>จัดเรียงหมวดหมู่</span>
                    </button>
                </div>
            </div>
        `;
        const menuContentHtml = sortedCategories.map(cat => `
        <div class="mb-6">
          <h3 class="text-base font-bold text-gray-900 mb-3 ios-category-header sticky top-0 z-10">${cat.name}</h3>
          <div class="menu-items-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" data-category-id="${cat.id}">
            ${cat.items.map(item => {
                const isSoldOut = item.is_sold_out;
                const hasImage = !!item.image_url;
                if (isSortingMenuItems) {
                    return `
                    <div data-id="${item.id}" class="ios-card menu-tile sorting-active bg-white text-left flex items-center h-full min-h-[82px] overflow-hidden p-0 border border-dashed border-gray-300">
                        <div class="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center shrink-0 ml-3 border border-gray-150">
                            ${hasImage 
                                ? `<img src="${item.image_url}" class="w-full h-full object-cover">` 
                                : `<i class="fas fa-burger text-gray-300 text-xs"></i>`
                            }
                        </div>
                        <div class="flex-grow p-3 flex flex-col justify-center pointer-events-none min-w-0">
                            <div class="font-bold text-gray-900 leading-tight text-xs sm:text-sm truncate">${item.name_th}</div>
                            <div class="text-xs font-bold text-[#FF9500] mt-1">${Utils.formatCurrency(item.base_price_cents)}</div>
                        </div>
                        <span class="drag-handle bg-gray-50 border-l border-gray-100 text-gray-400 hover:text-gray-600 hover:bg-gray-100 w-10 flex items-center justify-center shrink-0 cursor-move text-base h-full transition"><i class="fas fa-bars pointer-events-none"></i></span>
                    </div>`;
                }
                return `
                <button data-action="add-menu" data-id="${item.id}" ${isSoldOut ? 'disabled' : ''} class="ios-card menu-tile bg-white p-2.5 text-left flex items-center gap-3 h-full min-h-[82px] ${isSoldOut ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'hover:border-[#007AFF]/30 active:scale-[0.98]'}" style="transition: transform 0.1s ease, border-color 0.15s ease;">
                    <!-- Thumbnail Image -->
                    <div class="w-14 h-14 rounded-xl bg-gray-50 border border-gray-150/80 overflow-hidden flex items-center justify-center shrink-0">
                        ${hasImage 
                            ? `<img src="${item.image_url}" class="w-full h-full object-cover">` 
                            : `<i class="fas fa-burger text-gray-300 text-sm"></i>`
                        }
                    </div>
                    <!-- Details -->
                    <div class="pointer-events-none min-w-0 flex-1 flex flex-col justify-between h-14 py-0.5">
                        <div class="font-bold text-gray-900 leading-tight text-xs sm:text-sm truncate">${item.name_th}</div>
                        ${isSoldOut ? '<span class="text-[9px] text-[#FF3B30] font-bold flex items-center gap-0.5 mt-0.5"><i class="fas fa-exclamation-circle"></i> หมดชั่วคราว</span>' : ''}
                        <div class="pointer-events-none text-xs sm:text-sm font-bold text-[#FF9500] mt-0.5">${Utils.formatCurrency(item.base_price_cents)}</div>
                    </div>
                </button>`;
            }).join('')}
          </div>
        </div>
        `).join('');
        return headerHtml + menuContentHtml;
    }
    static bindEvents(container, menuTree, { onAddMenu, onToggleSortItems, onOpenSortSettings }) {
        const buttons = container.querySelectorAll('[data-action="add-menu"]');
        buttons.forEach(btn => {
            btn.addEventListener('click', e => {
                const id = e.currentTarget.dataset.id;
                const item = menuTree.find(m => m.id === id);
                if (item && onAddMenu) onAddMenu(item);
            });
        });
        const btnSortSettings = container.querySelector('#btn-sort-settings');
        if (btnSortSettings && onOpenSortSettings) btnSortSettings.addEventListener('click', onOpenSortSettings);
        const btnSortMenuItems = container.querySelector('#btn-sort-menu-items');
        if (btnSortMenuItems && onToggleSortItems) btnSortMenuItems.addEventListener('click', onToggleSortItems);
    }
    static initMenuItemsSortable(container) {
        const grids = container.querySelectorAll('.menu-items-grid');
        const sortables = [];
        grids.forEach(grid => {
            const sortable = new Sortable(grid, {
                animation: 150,
                ghostClass: 'opacity-40',
                dragClass: 'shadow-2xl',
                handle: '.drag-handle',
                // Mobile drag improvements
                delay: 0,
                delayOnTouchOnly: false,
                touchStartThreshold: 0,
                fallbackTolerance: 5,
                swapThreshold: 0.5,
                invertSwap: true
            });
            sortables.push(sortable);
        });
        return sortables;
    }
}
