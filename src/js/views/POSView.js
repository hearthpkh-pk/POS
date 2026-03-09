import { posService } from '../services/POSService.js';
import { Utils } from '../utils.js';

export class POSView {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.currentView = 'pos_orders'; // 'pos_orders' | 'pos_menu'
        this.menuTree = [];
        this.pendingOrders = {}; // Local state for UI representation
        this.currentTableId = 'ออเดอร์ใหม่';
    }

    setMenu(menuData) {
        this.menuTree = menuData;
    }

    render() {
        if (!this.container) return;

        const calcs = posService.calculateTotals();
        const pendingCount = Object.keys(this.pendingOrders).filter(k => k !== 'ออเดอร์ใหม่').length;
        const canPark = posService.cart.length > 0;

        let middleContentHtml = this.currentView === 'pos_menu' ? this.getMenuHTML() : this.getPendingListHTML();

        let discountLabel = posService.discount.value > 0
            ? (posService.discount.type === 'PERCENTAGE' ? `ส่วนลด (${posService.discount.value}%)` : `ส่วนลด (-${posService.discount.value}฿)`)
            : "ส่วนลด";

        this.container.innerHTML = `
        <div class="pos-grid">
            <div class="pending-column">
                <div class="flex bg-white border-b px-2 lg:px-4 pt-2 lg:pt-4 space-x-1 shrink-0 overflow-x-auto">
                    <button id="tab-orders" class="whitespace-nowrap px-3 lg:px-4 py-2 rounded-t-lg text-sm font-bold transition ${this.currentView === 'pos_orders' ? 'bg-gray-200 text-gray-800 border border-b-0 border-gray-300' : 'bg-white text-gray-500 hover:bg-gray-50'}">
                      <i class="fas fa-list mr-1 lg:hidden"></i> รายการบิล (${pendingCount})
                    </button>
                    <button id="tab-menu" class="whitespace-nowrap px-3 lg:px-4 py-2 rounded-t-lg text-sm font-bold transition ${this.currentView === 'pos_menu' ? 'bg-orange-100 text-orange-700 border border-b-0 border-orange-200' : 'bg-white text-gray-500 hover:bg-gray-50'}">
                      <i class="fas fa-utensils mr-1 lg:hidden"></i> เมนูอาหาร
                    </button>
                </div>
                <div class="flex-grow custom-scroll p-2 lg:p-4 overflow-y-auto">${middleContentHtml}</div>
            </div>
            <div class="detail-column">
                <div class="p-3 lg:p-4 border-b bg-white shrink-0 shadow-sm z-10"><div class="flex justify-between items-center"><h2 class="text-lg lg:text-xl font-black text-gray-800 truncate mr-2">${this.currentTableId === 'ออเดอร์ใหม่' ? '🛒 ออเดอร์ใหม่' : this.currentTableId}</h2><span class="shrink-0 px-2 py-1 bg-green-100 text-green-700 text-[10px] lg:text-xs font-bold rounded-full">Open</span></div></div>
                <div class="flex-grow custom-scroll p-2 lg:p-4 space-y-2 overflow-y-auto bg-gray-50">
                  ${posService.cart.length === 0
                ? '<div class="h-full flex flex-col items-center justify-center text-gray-400 italic text-sm opacity-60"><i class="fas fa-shopping-basket text-4xl mb-2"></i><p>เลือกเมนูเพื่อเริ่มรายการ</p></div>'
                : posService.cart.map(item => `
                      <div class="bg-white p-2 lg:p-3 rounded-lg shadow-sm border border-gray-100 flex justify-between items-center">
                        <div class="min-w-0 flex-1 pr-2">
                          <div class="font-bold text-gray-800 truncate text-sm lg:text-base">${item.name_th}</div>
                          <div class="text-xs text-gray-500">${Utils.formatCurrency(item.base_price_cents)} x ${item.quantity}</div>
                        </div>
                        <div class="flex items-center space-x-1 lg:space-x-2 shrink-0">
                          <button data-action="decrease-qty" data-id="${item.id}" class="w-6 h-6 lg:w-7 lg:h-7 rounded-full bg-gray-200 hover:bg-red-100 text-gray-600 hover:text-red-600 flex items-center justify-center text-xs"><i class="fas fa-minus pointer-events-none"></i></button>
                          <span class="w-4 lg:w-6 text-center font-bold text-sm">${item.quantity}</span>
                          <button data-action="increase-qty" data-id="${item.id}" class="w-6 h-6 lg:w-7 lg:h-7 rounded-full bg-gray-200 hover:bg-green-100 text-gray-600 hover:text-green-600 flex items-center justify-center text-xs"><i class="fas fa-plus pointer-events-none"></i></button>
                        </div>
                        <div class="text-right font-bold text-gray-800 w-16 ml-1 text-sm lg:text-base">${Utils.formatCurrency(item.base_price_cents * item.quantity)}</div>
                      </div>
                    `).join('')
            }
                </div>
                <div class="p-3 lg:p-4 bg-white border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] shrink-0 z-20">
                    <div class="space-y-1 mb-2 lg:mb-3 text-xs lg:text-sm">
                      <div class="flex justify-between text-gray-500">
                        <span>รวม</span><span>${Utils.formatCurrency(calcs.subtotalCents)}</span>
                      </div>
                      <div class="flex justify-between items-center text-red-500 cursor-pointer" id="btn-discount-modal">
                        <span class="flex items-center hover:underline">${discountLabel} <i class="fas fa-edit ml-1 text-[10px]"></i></span>
                        <span>-${Utils.formatCurrency(calcs.discountAmountCents)}</span>
                      </div>
                      <div class="flex justify-between items-end pt-2 border-t mt-1">
                        <span class="text-gray-800 font-bold text-base lg:text-lg">สุทธิ</span>
                        <span class="text-2xl lg:text-3xl font-black text-gray-900">${Utils.formatCurrency(calcs.totalNetCents)}</span>
                      </div>
                    </div>
                    <div class="grid grid-cols-4 gap-1 lg:gap-2">
                      <button id="btn-discount" class="col-span-1 py-2 lg:py-3 bg-yellow-100 text-yellow-700 rounded-lg font-bold hover:bg-yellow-200 disabled:opacity-50 text-xs lg:text-sm" ${!canPark ? 'disabled' : ''}><i class="fas fa-tag block lg:inline mb-1 lg:mb-0"></i> <span class="hidden lg:inline">ส่วนลด</span></button>
                      <button id="btn-park" class="col-span-1 py-2 lg:py-3 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200 disabled:opacity-50 text-xs lg:text-sm" ${!canPark ? 'disabled' : ''}>${this.currentTableId === 'ออเดอร์ใหม่' ? 'พักบิล' : 'บันทึก'}</button>
                      <button id="btn-receipt" class="col-span-1 py-2 lg:py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 text-xs lg:text-sm" ${!canPark ? 'disabled' : ''}>แจ้งหนี้</button>
                      <button id="btn-checkout" class="col-span-1 py-2 lg:py-3 bg-orange-600 text-white rounded-lg font-bold hover:bg-orange-700 shadow-md disabled:opacity-50 text-xs lg:text-sm" ${!canPark ? 'disabled' : ''}>ชำระเงิน</button>
                    </div>
                </div>
            </div>
        </div>
    `;

        this.bindEvents();
    }

    getMenuHTML() {
        const menuByCategory = this.menuTree.reduce((acc, item) => {
            const cat = item.categories?.name_th || 'อื่นๆ';
            acc[cat] = acc[cat] || [];
            acc[cat].push(item);
            return acc;
        }, {});

        if (this.menuTree.length === 0) {
            return '<div class="text-center text-gray-500 py-10">ไม่พบรายการเมนู<br>โปรดเพิ่มเมนูใหม่ในหน้า "จัดการเมนู"</div>';
        }

        return Object.keys(menuByCategory).map(category => `
        <div class="mb-6">
          <h3 class="text-lg font-bold text-gray-800 mb-3 border-b border-orange-300 pb-1 sticky top-0 bg-[#E5E7EB] z-10 py-2">${category}</h3>
          <div class="grid grid-cols-2 lg:grid-cols-3 gap-3">
            ${menuByCategory[category].map(item => `
              <button data-action="add-menu" data-id="${item.id}" class="menu-tile bg-white p-3 rounded-lg shadow-md border border-gray-200 text-left flex flex-col justify-between h-full min-h-[100px]">
                <div class="pointer-events-none">
                  <div class="font-bold text-gray-900 leading-tight text-sm">${item.name_th}</div>
                </div>
                <div class="pointer-events-none text-lg font-black text-orange-600 mt-2 text-right">${Utils.formatCurrency(item.base_price_cents)}</div>
              </button>
            `).join('')}
          </div>
        </div>
    `).join('');
    }

    getPendingListHTML() {
        const pendingKeys = Object.keys(this.pendingOrders).filter(k => k !== 'ออเดอร์ใหม่');

        let html = `
      <div id="btn-new-order" class="bg-white p-4 rounded-xl shadow-md border-2 border-dashed border-gray-300 mb-3 cursor-pointer hover:border-orange-500 hover:bg-orange-50 transition flex items-center justify-center text-gray-500 hover:text-orange-600 ${this.currentTableId === 'ออเดอร์ใหม่' ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-200' : ''}">
        <div class="font-bold flex items-center pointer-events-none">
          <i class="fas fa-plus-circle mr-2"></i> เปิดออเดอร์ใหม่
        </div>
      </div>
    `;

        if (pendingKeys.length === 0) {
            html += '<div class="text-center text-gray-500 py-10 text-xs">ไม่มีบิลที่พักไว้</div>';
        } else {
            html += pendingKeys.map(key => {
                // Placeholder implementation for UI structure
                const isActive = this.currentTableId === key;
                return `
            <div data-action="select-table" data-id="${key}" class="bg-white p-4 rounded-xl shadow-md border mb-3 cursor-pointer transition relative overflow-hidden ${isActive ? 'border-orange-500 ring-2 ring-orange-200' : 'border-gray-200 hover:bg-orange-50'}">
              ${isActive ? '<div class="absolute top-0 right-0 bg-orange-500 text-white text-[10px] px-2 py-0.5 rounded-bl-lg font-bold pointer-events-none">กำลังใช้งาน</div>' : ''}
              <div class="flex justify-between items-center mb-2 pointer-events-none">
                <div class="font-black text-lg text-gray-800">${key}</div>
                <div class="font-bold text-xl text-orange-600">฿ -</div>
              </div>
              <div class="flex justify-between text-xs text-gray-500 pointer-events-none">
                <span>รอข้อมูล...</span>
              </div>
            </div>
          `;
            }).join('');
        }
        return html;
    }

    bindEvents() {
        // Top Tabs
        const tabOrders = this.container.querySelector('#tab-orders');
        const tabMenu = this.container.querySelector('#tab-menu');

        if (tabOrders) tabOrders.addEventListener('click', () => { this.currentView = 'pos_orders'; this.render(); });
        if (tabMenu) tabMenu.addEventListener('click', () => { this.currentView = 'pos_menu'; this.render(); });

        // Menu Add
        const buttons = this.container.querySelectorAll('[data-action="add-menu"]');
        buttons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                const item = this.menuTree.find(m => m.id === id);
                if (item) {
                    posService.addItem(item, 1);
                    this.render();
                }
            });
        });

        // Quantity Handlers
        const incButtons = this.container.querySelectorAll('[data-action="increase-qty"]');
        incButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                const item = posService.cart.find(i => i.id === id);
                if (item) posService.updateQuantity(id, item.quantity + 1);
                this.render();
            });
        });

        const decButtons = this.container.querySelectorAll('[data-action="decrease-qty"]');
        decButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                const item = posService.cart.find(i => i.id === id);
                if (item) posService.updateQuantity(id, item.quantity - 1);
                this.render();
            });
        });

        // We will delegate modal, checkout, park to the main App coordinator in the next steps 
        // to avoid coupling UI directly to window.app here if possible, but we can emit events or callbacks.
    }
}
