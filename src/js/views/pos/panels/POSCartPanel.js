import { posService } from '../../../services/POSService.js';
import { Utils } from '../../../utils.js';

export class POSCartPanel {
    static getHTML(currentTableId) {
        const calcs = posService.calculateTotals();
        const canPark = posService.cart.length > 0;

        let discountLabel = posService.discount.value > 0
            ? (posService.discount.type === 'PERCENTAGE' ? `ส่วนลด (${posService.discount.value}%)` : `ส่วนลด (-${posService.discount.value}฿)`)
            : "ส่วนลด";

        return `
            <div class="pos-cart-panel h-full flex flex-col justify-between">
                <div class="p-3 lg:p-4 border-b border-gray-200 bg-white shrink-0 z-10">
                    <div class="flex justify-between items-center">
                        <h2 class="text-base font-bold text-gray-900 truncate mr-2">${currentTableId === 'ออเดอร์ใหม่' ? '🛒 ออเดอร์ใหม่' : currentTableId}</h2>
                        <span class="shrink-0 px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-semibold rounded-full">Open</span>
                    </div>
                </div>
                <div class="flex-grow custom-scroll p-3 space-y-2.5 overflow-y-auto bg-[#F2F2F7]">
                  ${posService.cart.length === 0
                ? '<div class="h-full flex flex-col items-center justify-center text-gray-400 italic text-sm opacity-60"><i class="fas fa-shopping-basket text-3xl mb-2"></i><p>เลือกเมนูเพื่อเริ่มรายการ</p></div>'
                : posService.cart.map(item => `
                      <div class="ios-card bg-white p-3 flex justify-between items-center">
                        <div class="min-w-0 flex-1 pr-2">
                          <div class="font-semibold text-gray-950 truncate text-sm">${item.name_th}</div>
                          <div class="text-xs text-gray-500 mt-0.5">${Utils.formatCurrency(item.base_price_cents)} x ${item.quantity}</div>
                        </div>
                        <div class="flex items-center space-x-2 shrink-0">
                          <button data-action="decrease-qty" data-id="${item.id}" class="ios-stepper-btn ios-stepper-btn-decrease"><i class="fas fa-minus pointer-events-none"></i></button>
                          <span class="w-4 text-center font-bold text-sm text-gray-800">${item.quantity}</span>
                          <button data-action="increase-qty" data-id="${item.id}" class="ios-stepper-btn ios-stepper-btn-increase"><i class="fas fa-plus pointer-events-none"></i></button>
                        </div>
                        <div class="text-right font-bold text-gray-900 w-16 ml-1 text-sm">${Utils.formatCurrency(item.base_price_cents * item.quantity)}</div>
                      </div>
                    `).join('')
            }
                </div>
                <div class="p-3 lg:p-4 bg-white border-t border-gray-200 shrink-0 z-20 shadow-[0_-8px_24px_rgba(0,0,0,0.04)]">
                    <div class="space-y-1.5 mb-3 text-xs lg:text-sm">
                      <div class="flex justify-between text-gray-500">
                        <span>รวม</span><span class="font-medium text-gray-800">${Utils.formatCurrency(calcs.subtotalCents)}</span>
                      </div>
                      <div class="flex justify-between items-center text-red-500 cursor-pointer" id="btn-discount-modal">
                        <span class="flex items-center hover:underline">${discountLabel} <i class="fas fa-edit ml-1 text-[10px]"></i></span>
                        <span class="font-medium">-${Utils.formatCurrency(calcs.discountAmountCents)}</span>
                      </div>
                      <div class="ios-divider my-2"></div>
                      <div class="flex justify-between items-end">
                        <span class="text-gray-900 font-bold text-base">สุทธิ</span>
                        <span class="text-xl lg:text-2xl font-black text-gray-900">${Utils.formatCurrency(calcs.totalNetCents)}</span>
                      </div>
                    </div>
                    <div class="grid grid-cols-4 gap-2 pt-1">
                      <button id="btn-discount" class="ios-action-btn ios-btn-secondary col-span-1 py-2.5 text-xs" ${!canPark ? 'disabled' : ''}><i class="fas fa-tag block mb-1"></i> <span class="hidden sm:inline">ส่วนลด</span></button>
                      <button id="btn-park" class="ios-action-btn ios-btn-secondary col-span-1 py-2.5 text-xs font-semibold" ${!canPark ? 'disabled' : ''}>${currentTableId === 'ออเดอร์ใหม่' && !posService.activeOrderId ? 'พักบิล' : 'บันทึก'}</button>
                      <button id="btn-receipt" class="ios-action-btn ios-btn-secondary col-span-1 py-2.5 text-xs font-semibold" ${!canPark ? 'disabled' : ''}>แจ้งหนี้</button>
                      <button id="btn-checkout" class="ios-action-btn ios-btn-primary col-span-1 py-2.5 text-xs font-bold shadow-sm" ${!canPark ? 'disabled' : ''}>ชำระเงิน</button>
                    </div>
                </div>
            </div>
        `;
    }

    static bindEvents(container, { onQtyChange, onDiscountClick, onParkClick, onReceiptClick, onCheckoutClick }) {
        // Quantity Handlers (increase/decrease)
        const incButtons = container.querySelectorAll('[data-action="increase-qty"]');
        incButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                const item = posService.cart.find(i => i.id === id);
                if (item && onQtyChange) {
                    onQtyChange(id, item.quantity + 1);
                }
            });
        });

        const decButtons = container.querySelectorAll('[data-action="decrease-qty"]');
        decButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                const item = posService.cart.find(i => i.id === id);
                if (item && onQtyChange) {
                    onQtyChange(id, item.quantity - 1);
                }
            });
        });

        // Discount buttons (direct tag button or inline label text)
        const btnDiscount = container.querySelector('#btn-discount');
        if (btnDiscount && onDiscountClick) {
            btnDiscount.addEventListener('click', onDiscountClick);
        }
        const btnDiscountModal = container.querySelector('#btn-discount-modal');
        if (btnDiscountModal && onDiscountClick) {
            btnDiscountModal.addEventListener('click', onDiscountClick);
        }

        // Park button
        const btnPark = container.querySelector('#btn-park');
        if (btnPark && onParkClick) {
            btnPark.addEventListener('click', onParkClick);
        }

        // Receipt button
        const btnReceipt = container.querySelector('#btn-receipt');
        if (btnReceipt && onReceiptClick) {
            btnReceipt.addEventListener('click', onReceiptClick);
        }

        // Checkout button
        const btnCheckout = container.querySelector('#btn-checkout');
        if (btnCheckout && onCheckoutClick) {
            btnCheckout.addEventListener('click', onCheckoutClick);
        }
    }
}
