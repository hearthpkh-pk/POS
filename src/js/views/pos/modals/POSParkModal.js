import { posService } from '../../../services/POSService.js';

export class POSParkModal {
    static show(currentTableId, onParkCallback) {
        if (posService.cart.length === 0) return;

        // If it's already an active draft order, update without prompting
        if (currentTableId !== 'ออเดอร์ใหม่') {
            if (onParkCallback) {
                onParkCallback(currentTableId);
            }
            return;
        }

        // Prompt for table name/identifier
        const modal = document.getElementById('custom-modal');
        const title = document.getElementById('modal-title');
        const message = document.getElementById('modal-message');
        const btnConfirm = document.getElementById('modal-confirm-btn');
        const btnCancel = document.getElementById('modal-cancel-btn');

        if (!modal) return;

        title.textContent = 'พักบิลอาหาร';
        btnCancel.classList.remove('hidden');
        btnCancel.textContent = 'ยกเลิก';
        btnConfirm.textContent = 'พักบิล';

        message.innerHTML = `
            <div class="p-5 w-full space-y-4 text-left bg-[#F2F2F7]">
                <div>
                    <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">ระบุชื่อโต๊ะ หรือ ชื่อลูกค้า</label>
                    <input id="park-table-input" type="text" class="ios-input font-bold text-lg" placeholder="เช่น โต๊ะ 3, คุณลูกค้า" required>
                </div>
            </div>
        `;

        btnConfirm.onclick = async () => {
            const tableInput = message.querySelector('#park-table-input');
            const tableId = tableInput.value.trim();
            if (!tableId) {
                alert('กรุณากรอกชื่อโต๊ะ หรือ ชื่อลูกค้า');
                return;
            }
            modal.classList.add('hidden');
            if (onParkCallback) {
                await onParkCallback(tableId);
            }
        };

        modal.classList.remove('hidden');
        message.querySelector('#park-table-input').focus();
    }
}
