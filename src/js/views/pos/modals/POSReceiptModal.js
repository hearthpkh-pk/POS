import { posService } from '../../../services/POSService.js';
import { Utils } from '../../../utils.js';

export class POSReceiptModal {
    static show(currentTableId, orderData = null) {
        const modal = document.getElementById('custom-modal');
        const title = document.getElementById('modal-title');
        const message = document.getElementById('modal-message');
        const btnConfirm = document.getElementById('modal-confirm-btn');
        const btnCancel = document.getElementById('modal-cancel-btn');

        if (!modal) return;

        title.textContent = 'ตัวอย่างใบแจ้งหนี้ / ใบเสร็จรับเงิน';
        btnCancel.classList.remove('hidden');
        btnCancel.textContent = 'ปิด';
        btnConfirm.textContent = 'พิมพ์ใบเสร็จ';

        let cartItems = [];
        let subtotalCents = 0;
        let discountAmountCents = 0;
        let vatAmountCents = 0;
        let totalNetCents = 0;
        let orderNo = '';
        let dateStr = '';
        let tableId = '';

        if (orderData) {
            // Use historical order data
            cartItems = (orderData.order_items || []).map(item => ({
                quantity: item.quantity,
                name_th: item.item_name_th || item.item_name_en || 'สินค้า',
                base_price_cents: item.price_per_unit_cents
            }));
            subtotalCents = orderData.total_subtotal_cents || cartItems.reduce((sum, item) => sum + (item.base_price_cents * item.quantity), 0);
            discountAmountCents = orderData.discount_amount_cents || 0;
            vatAmountCents = orderData.vat_amount_cents || 0;
            totalNetCents = orderData.total_net_cents;
            orderNo = orderData.order_no;
            dateStr = Utils.formatDateTime(orderData.created_at, { dateStyle: 'medium', timeStyle: 'short' });
            tableId = orderData.table_id || 'ออเดอร์ทั่วไป';
        } else {
            // Use active shopping cart
            if (posService.cart.length === 0) return;
            cartItems = posService.cart.map(item => ({
                quantity: item.quantity,
                name_th: item.name_th,
                base_price_cents: item.base_price_cents
            }));
            const calcs = posService.calculateTotals();
            subtotalCents = calcs.subtotalCents;
            discountAmountCents = calcs.discountAmountCents;
            vatAmountCents = calcs.vatAmountCents;
            totalNetCents = calcs.totalNetCents;
            orderNo = posService.activeOrderId 
                ? `INV-DRAFT-${posService.activeOrderId.slice(0, 8).toUpperCase()}`
                : `INV-TEMP-${Date.now().toString().slice(-6)}`;
            dateStr = Utils.formatDateTime(new Date().toISOString(), { dateStyle: 'medium', timeStyle: 'short' });
            tableId = currentTableId;
        }

        const settings = window.app?.settings || {};
        const storeName = settings['store_name'] || 'POS';
        const location = settings['location'] || '';
        const storePhone = settings['store_phone'] || '';

        const receiptHTML = `
            <div id="receipt-content" class="bg-white p-6 shadow-sm rounded-xl text-left font-mono text-xs leading-relaxed max-w-[320px] mx-auto my-3 border border-gray-200/50 text-gray-800">
                <div class="text-center mb-4">
                    <div class="text-base font-black tracking-wider uppercase">${storeName}</div>
                    ${location ? `<div class="text-[9px] text-gray-500">${location}</div>` : ''}
                    ${storePhone ? `<div class="text-[9px] text-gray-500">โทร: ${storePhone}</div>` : ''}
                </div>

                <div class="receipt-dashed-line"></div>

                <div class="text-[10px] space-y-1 mb-2">
                    <div><b>เลขที่ออเดอร์:</b> ${orderNo}</div>
                    <div><b>วันที่:</b> ${dateStr}</div>
                    <div><b>โต๊ะ/ลูกค้า:</b> ${tableId}</div>
                    <div><b>พนักงานขาย:</b> Cashier (Owner)</div>
                </div>

                <div class="receipt-dashed-line"></div>

                <div class="space-y-2 text-[10px]">
                    <div class="grid grid-cols-12 font-bold mb-1">
                        <span class="col-span-2 text-left">จำนวน</span>
                        <span class="col-span-6 text-left">รายการ</span>
                        <span class="col-span-4 text-right">ยอดรวม</span>
                    </div>
                    ${cartItems.map(item => `
                        <div class="grid grid-cols-12">
                            <span class="col-span-2 text-left">${item.quantity}x</span>
                            <span class="col-span-6 text-left truncate">${item.name_th}</span>
                            <span class="col-span-4 text-right">${Utils.formatCurrency(item.base_price_cents * item.quantity)}</span>
                        </div>
                    `).join('')}
                </div>

                <div class="receipt-dashed-line"></div>

                <div class="text-[10px] space-y-1.5">
                    <div class="flex justify-between">
                        <span>มูลค่ารวม (Subtotal)</span>
                        <span>${Utils.formatCurrency(subtotalCents)}</span>
                    </div>
                    ${discountAmountCents > 0 ? `
                    <div class="flex justify-between text-red-600">
                        <span>ส่วนลด (Discount)</span>
                        <span>-${Utils.formatCurrency(discountAmountCents)}</span>
                    </div>
                    ` : ''}
                    <div class="flex justify-between font-bold text-gray-900 pt-1 border-t border-dashed">
                        <span>ยอดสุทธิ (Total Net)</span>
                        <span>${Utils.formatCurrency(totalNetCents)}</span>
                    </div>
                    <div class="receipt-dashed-line"></div>
                    <div class="flex justify-between text-[9px] text-gray-500">
                        <span>ในจำนวนนี้เป็นภาษีมูลค่าเพิ่ม (VAT 7%)</span>
                        <span>${Utils.formatCurrency(vatAmountCents)}</span>
                    </div>
                </div>

                <div class="receipt-dashed-line"></div>

                <div class="text-center text-[9px] text-gray-500 mt-4 leading-normal">
                    ขอบคุณที่ใช้บริการ / Thank You!<br>
                    ใบกำกับภาษีอย่างย่อ / Tax Invoice (ABB)
                </div>
            </div>
        `;

        message.innerHTML = `
            <div class="w-full bg-[#F2F2F7] flex flex-col items-center justify-center p-3">
                ${receiptHTML}
            </div>
        `;

        btnConfirm.onclick = () => {
            let printArea = document.getElementById('print-receipt-area');
            if (!printArea) {
                printArea = document.createElement('div');
                printArea.id = 'print-receipt-area';
                document.body.appendChild(printArea);
            }
            printArea.innerHTML = receiptHTML;
            window.print();
        };

        modal.classList.remove('hidden');
    }
}
