import { posService } from '../../../services/POSService.js';
import { Utils } from '../../../utils.js';

export class POSCheckoutModal {
    static show(onCheckoutCallback) {
        if (posService.cart.length === 0) return;

        const modal = document.getElementById('custom-modal');
        const title = document.getElementById('modal-title');
        const message = document.getElementById('modal-message');
        const btnConfirm = document.getElementById('modal-confirm-btn');
        const btnCancel = document.getElementById('modal-cancel-btn');

        if (!modal) return;

        title.textContent = 'ชำระเงิน';
        btnCancel.classList.remove('hidden');
        btnCancel.textContent = 'ยกเลิก';
        btnConfirm.textContent = 'บันทึกชำระเงิน';

        const calcs = posService.calculateTotals();

        message.innerHTML = `
            <div class="p-5 w-full space-y-4 text-left bg-[#F2F2F7]">
                <div class="ios-card bg-white p-4 flex justify-between items-center shadow-sm">
                    <span class="text-sm font-bold text-gray-800">ยอดรวมสุทธิ</span>
                    <span class="text-xl font-black text-[#FF9500]">${Utils.formatCurrency(calcs.totalNetCents)}</span>
                </div>
                <div>
                    <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">ช่องทางการชำระเงิน</label>
                    <div class="grid grid-cols-2 gap-2.5" id="payment-methods-grid">
                        <button type="button" data-value="CASH" class="ios-card py-3 px-4 text-sm flex flex-col items-center justify-center gap-1"><i class="fas fa-money-bill-wave text-base"></i> เงินสด</button>
                        <button type="button" data-value="TRANSFER" class="ios-card py-3 px-4 text-sm flex flex-col items-center justify-center gap-1"><i class="fas fa-mobile-alt text-base"></i> โอนเงิน / PromptPay</button>
                    </div>
                </div>
                <div>
                    <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">หมายเหตุท้ายบิล (ไม่บังคับ)</label>
                    <input id="checkout-notes-input" type="text" class="ios-input font-medium" placeholder="เช่น ขอจานเพิ่ม, เผ็ดน้อย">
                </div>
            </div>
        `;

        let selectedMethod = 'CASH';
        const updateUI = () => {
            message.querySelectorAll('#payment-methods-grid button').forEach(btn => {
                if (btn.dataset.value === selectedMethod) {
                    btn.className = 'ios-card py-3 px-4 text-sm flex flex-col items-center justify-center gap-1 border-2 border-[#007AFF] bg-blue-50/50 text-[#007AFF] font-bold';
                } else {
                    btn.className = 'ios-card py-3 px-4 text-sm flex flex-col items-center justify-center gap-1 border-2 border-transparent bg-white text-gray-600 hover:bg-gray-50';
                }
            });
        };

        message.querySelectorAll('#payment-methods-grid button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                selectedMethod = e.currentTarget.dataset.value;
                updateUI();
            });
        });
        updateUI();

        btnConfirm.onclick = async () => {
            const notesInput = message.querySelector('#checkout-notes-input');
            const notes = notesInput.value.trim();
            modal.classList.add('hidden');
            if (onCheckoutCallback) {
                await onCheckoutCallback(selectedMethod, notes);
            }
        };

        modal.classList.remove('hidden');
    }
}
