import { posService } from '../../../services/POSService.js';
import { Utils } from '../../../utils.js';

export class POSDiscountModal {
    static show(onSave) {
        const modal = document.getElementById('custom-modal');
        const title = document.getElementById('modal-title');
        const message = document.getElementById('modal-message');
        const btnConfirm = document.getElementById('modal-confirm-btn');
        const btnCancel = document.getElementById('modal-cancel-btn');

        if (!modal) return;

        title.textContent = 'ระบุส่วนลดท้ายบิล';
        btnCancel.classList.remove('hidden');
        btnCancel.textContent = 'ยกเลิก';
        btnConfirm.textContent = 'บันทึก';

        let currentType = posService.discount.type;

        message.innerHTML = `
            <div class="p-5 w-full space-y-4 text-left bg-[#F2F2F7]">
                <div>
                    <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">ประเภทส่วนลด</label>
                    <div class="ios-segmented-control">
                        <button type="button" id="discount-type-amount" class="ios-segmented-item">จำนวนเงิน (฿)</button>
                        <button type="button" id="discount-type-percent" class="ios-segmented-item">เปอร์เซ็นต์ (%)</button>
                    </div>
                </div>
                <div>
                    <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">มูลค่าส่วนลด</label>
                    <input id="discount-value-input" type="number" min="0" step="any" class="ios-input font-bold text-lg" value="${posService.discount.value}">
                </div>
            </div>
        `;

        const btnAmount = message.querySelector('#discount-type-amount');
        const btnPercent = message.querySelector('#discount-type-percent');

        const updateUI = () => {
            if (currentType === 'AMOUNT') {
                btnAmount.classList.add('active');
                btnPercent.classList.remove('active');
            } else {
                btnAmount.classList.remove('active');
                btnPercent.classList.add('active');
            }
        };

        btnAmount.addEventListener('click', () => { currentType = 'AMOUNT'; updateUI(); });
        btnPercent.addEventListener('click', () => { currentType = 'PERCENTAGE'; updateUI(); });
        updateUI();

        btnConfirm.onclick = () => {
            const valInput = message.querySelector('#discount-value-input');
            const val = Number(valInput.value) || 0;
            posService.applyDiscount(currentType, val);
            modal.classList.add('hidden');
            if (onSave) onSave();
        };

        modal.classList.remove('hidden');
    }
}
