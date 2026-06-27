import { posService } from '../services/POSService.js';
import { Utils } from '../utils.js';

// Import panels and modals
import { POSBillPanel } from './pos/panels/POSBillPanel.js';
import { POSMenuPanel } from './pos/panels/POSMenuPanel.js';
import { POSCartPanel } from './pos/panels/POSCartPanel.js';
import { POSDiscountModal } from './pos/modals/POSDiscountModal.js';
import { POSReceiptModal } from './pos/modals/POSReceiptModal.js';
import { POSSortModal } from './pos/modals/POSSortModal.js';
import { POSParkModal } from './pos/modals/POSParkModal.js';
import { POSCheckoutModal } from './pos/modals/POSCheckoutModal.js';
import { POSVariantModal } from './pos/modals/POSVariantModal.js';

export class POSView {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.currentView = 'pos_orders'; // 'pos_orders' | 'pos_menu'
        this.menuTree = [];
        this.pendingOrders = [];
        this.currentTableId = 'ออเดอร์ใหม่';
        this.isSortingMenuItems = false;
        this.sortables = [];
        
        // Event callbacks to be handled by App
        this.onSelectOrderCallback = null;
        this.onNewOrderCallback = null;
        this.onParkCallback = null;
        this.onCheckoutCallback = null;
    }

    setMenu(menuData) {
        this.menuTree = menuData;
    }

    setPendingOrders(ordersList) {
        this.pendingOrders = ordersList || [];
    }

    render() {
        if (!this.container) return;

        const pendingCount = this.pendingOrders.length;
        const middleContentHtml = this.currentView === 'pos_menu' 
            ? POSMenuPanel.getHTML(this.menuTree, this.isSortingMenuItems) 
            : POSBillPanel.getHTML(this.pendingOrders, this.currentTableId);

        const cartHtml = POSCartPanel.getHTML(this.currentTableId);

        this.container.innerHTML = `
        <div class="pos-grid">
            <div class="pending-column">
                <div class="p-3 bg-[#F2F2F7] border-b border-gray-200 shrink-0">
                    <div class="ios-segmented-control">
                        <button id="tab-orders" class="ios-segmented-item ${this.currentView === 'pos_orders' ? 'active' : ''}">
                          <i class="fas fa-list"></i> <span>รายการบิล (${pendingCount})</span>
                        </button>
                        <button id="tab-menu" class="ios-segmented-item ${this.currentView === 'pos_menu' ? 'active' : ''}">
                          <i class="fas fa-utensils"></i> <span>เมนูอาหาร</span>
                        </button>
                    </div>
                </div>
                <div class="flex-grow custom-scroll p-3 lg:p-4 overflow-y-auto">${middleContentHtml}</div>
            </div>
            <div class="detail-column border-l border-gray-200" id="cart-panel-container">
                ${cartHtml}
            </div>
        </div>
    `;

        this.bindEvents();

        if (this.currentView === 'pos_menu' && this.isSortingMenuItems) {
            this.initMenuItemsSortable();
        }
    }

    bindEvents() {
        // Top Tabs
        const tabOrders = this.container.querySelector('#tab-orders');
        const tabMenu = this.container.querySelector('#tab-menu');

        if (tabOrders) tabOrders.addEventListener('click', () => { 
            this.isSortingMenuItems = false; 
            this.currentView = 'pos_orders'; 
            this.render(); 
        });
        if (tabMenu) tabMenu.addEventListener('click', () => { 
            this.isSortingMenuItems = false; 
            this.currentView = 'pos_menu'; 
            this.render(); 
        });

        // Delegate to Bill Panel events if active
        if (this.currentView === 'pos_orders') {
            POSBillPanel.bindEvents(this.container, {
                onSelectOrder: (orderId) => {
                    this.isSortingMenuItems = false;
                    if (this.onSelectOrderCallback) {
                        this.onSelectOrderCallback(orderId);
                    }
                },
                onNewOrder: () => {
                    this.isSortingMenuItems = false;
                    if (this.onNewOrderCallback) {
                        this.onNewOrderCallback();
                    }
                }
            });
        }

        // Delegate to Menu Panel events if active
        if (this.currentView === 'pos_menu') {
            POSMenuPanel.bindEvents(this.container, this.menuTree, {
                onAddMenu: (item) => {
                    if (item.is_sold_out) return;
                    if (item.variants && item.variants.length > 0) {
                        POSVariantModal.show(item, (selectedVariant) => {
                            const variantItem = {
                                ...item,
                                id: `${item.id}-${selectedVariant.name_en}`,
                                name_th: `${item.name_th} (${selectedVariant.name_th})`,
                                name_en: item.name_en ? `${item.name_en} (${selectedVariant.name_en})` : selectedVariant.name_en,
                                base_price_cents: selectedVariant.price_cents
                            };
                            posService.addItem(variantItem, 1);
                            this.render();
                        });
                    } else {
                        posService.addItem(item, 1);
                        this.render();
                    }
                },
                onToggleSortItems: async () => {
                    if (this.isSortingMenuItems) {
                        await this.saveMenuItemsOrder();
                        this.isSortingMenuItems = false;
                        this.render();
                    } else {
                        this.isSortingMenuItems = true;
                        this.render();
                    }
                },
                onOpenSortSettings: () => {
                    this.openSortModal();
                }
            });
        }

        // Delegate to Cart Panel events
        POSCartPanel.bindEvents(this.container, {
            onQtyChange: (id, newQty) => {
                posService.updateQuantity(id, newQty);
                this.render();
            },
            onDiscountClick: () => {
                this.showDiscountModal();
            },
            onParkClick: () => {
                this.handleParkClick();
            },
            onReceiptClick: () => {
                this.showPrintReceiptModal();
            },
            onCheckoutClick: () => {
                this.handleCheckoutClick();
            }
        });
    }

    showDiscountModal() {
        POSDiscountModal.show(() => this.render());
    }

    showPrintReceiptModal() {
        POSReceiptModal.show(this.currentTableId);
    }

    openSortModal() {
        POSSortModal.open(this.menuTree, async () => {
            if (window.app) {
                window.app.menuData = await posService.fetchMenu(window.app.companyId, window.app.branchId);
                this.setMenu(window.app.menuData);
                this.render();
            }
        });
    }

    handleParkClick() {
        POSParkModal.show(this.currentTableId, async (tableId) => {
            if (this.onParkCallback) {
                await this.onParkCallback(tableId);
            }
        });
    }

    handleCheckoutClick() {
        POSCheckoutModal.show(async (selectedMethod, notes) => {
            if (this.onCheckoutCallback) {
                await this.onCheckoutCallback(selectedMethod, notes);
            }
        });
    }

    initMenuItemsSortable() {
        // Destroy existing sortables first
        if (this.sortables) {
            this.sortables.forEach(s => {
                try { s.destroy(); } catch (e) {}
            });
        }
        this.sortables = POSMenuPanel.initMenuItemsSortable(this.container);
    }

    async saveMenuItemsOrder() {
        const spinner = document.getElementById('loading-spinner');
        spinner?.classList.remove('hidden');

        try {
            const updatesArray = [];
            const grids = this.container.querySelectorAll('.menu-items-grid');
            
            grids.forEach(grid => {
                const catId = grid.dataset.categoryId;
                const items = Array.from(grid.children);
                items.forEach((item, idx) => {
                    updatesArray.push({
                        id: item.dataset.id,
                        sort_order: idx + 1,
                        category_id: catId === 'others' ? null : catId
                    });
                });
            });

            await posService.updateMenuItemOrder(updatesArray);
            
            // Reload menu data to reflect changes
            if (window.app) {
                window.app.menuData = await posService.fetchMenu(window.app.companyId, window.app.branchId);
                this.setMenu(window.app.menuData);
            }
        } catch (err) {
            console.error('Failed to save menu items order:', err);
            alert('เกิดข้อผิดพลาดในการบันทึกการจัดเรียง: ' + err.message);
        } finally {
            spinner?.classList.add('hidden');
        }
    }
}