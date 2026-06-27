import { Utils } from '../../../utils.js';

export class POSVariantModal {
    static show(item, onSelect) {
        const modal = document.getElementById('custom-modal');
        const title = document.getElementById('modal-title');
        const message = document.getElementById('modal-message');
        const btnConfirm = document.getElementById('modal-confirm-btn');
        const btnCancel = document.getElementById('modal-cancel-btn');

        if (!modal) return;

        title.textContent = `เลือกตัวเลือก: ${item.name_th}`;
        btnCancel.classList.remove('hidden');
        btnCancel.textContent = 'ยกเลิก';
        
        // Hide the confirmation button since clicking the variant card directly confirms/selects it
        btnConfirm.classList.add('hidden');

        const variants = item.variants || [];

        message.innerHTML = `
            <div class="p-4 w-full space-y-3 bg-[#F2F2F7] text-left">
                <div class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">ตัวเลือกเมนู:</div>
                <div class="grid grid-cols-1 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
                    ${variants.map((v, index) => `
                        <button type="button" class="variant-select-btn ios-card bg-white hover:bg-gray-50 active:scale-[0.98] transition p-3.5 flex justify-between items-center w-full text-left border border-gray-150 rounded-2xl" data-index="${index}">
                            <div class="flex flex-col">
                                <span class="font-bold text-gray-900 text-sm">${v.name_th}</span>
                                <span class="text-[10px] text-gray-400 font-medium">${v.name_en || ''}</span>
                            </div>
                            <span class="font-black text-[#007AFF] text-sm">${Utils.formatCurrency(v.price_cents)}</span>
                        </button>
                    `).join('')}
                </div>
            </div>
        `;

        const buttons = message.querySelectorAll('.variant-select-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.index);
                const selected = variants[idx];
                modal.classList.add('hidden');
                if (onSelect) onSelect(selected);
            });
        });

        modal.classList.remove('hidden');
    }
}
