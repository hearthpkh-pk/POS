import { Utils } from '../../../utils.js';

export class POSModifierModal {
    static show(item, modifierGroups, itemModifierGroups, onConfirm) {
        const modal = document.getElementById('custom-modal');
        const title = document.getElementById('modal-title');
        const message = document.getElementById('modal-message');
        const btnConfirm = document.getElementById('modal-confirm-btn');
        const btnCancel = document.getElementById('modal-cancel-btn');

        if (!modal) return;

        // Find linked groups for this item
        const linkedGroupIds = itemModifierGroups
            .filter(link => link.menu_item_id === item.id)
            .map(link => link.modifier_group_id);

        const activeGroups = modifierGroups.filter(g => linkedGroupIds.includes(g.id));

        if (activeGroups.length === 0) {
            // No modifiers linked, bypass modal and add straight
            if (onConfirm) onConfirm([]);
            return;
        }

        title.textContent = `ตัวเลือกเสริม: ${item.name_th}`;
        btnCancel.classList.remove('hidden');
        btnCancel.textContent = 'ยกเลิก';
        
        btnConfirm.classList.remove('hidden');
        btnConfirm.textContent = 'ยืนยัน';

        message.innerHTML = `
            <div class="p-4 w-full space-y-4 bg-[#F2F2F7] text-left max-h-[60vh] overflow-y-auto custom-scroll">
                ${activeGroups.map(group => {
                    const options = (group.modifier_options || []).filter(o => o.is_active);
                    const isSingleSelect = group.max_selection === 1;
                    return `
                        <div class="modifier-group-block space-y-2" data-group-id="${group.id}" data-min="${group.min_selection}" data-max="${group.max_selection}" data-name="${group.name_th}">
                            <div class="flex justify-between items-center px-1">
                                <span class="text-xs font-bold text-gray-500 uppercase tracking-wider">${group.name_th}</span>
                                <span class="text-[10px] text-gray-400 font-semibold">
                                    ${group.min_selection > 0 ? `* ต้องเลือกอย่างน้อย ${group.min_selection}` : ''}
                                    ${group.max_selection > 1 ? `(สูงสุด ${group.max_selection} ตัวเลือก)` : ''}
                                </span>
                            </div>
                            <div class="grid grid-cols-1 gap-2">
                                ${options.map(opt => {
                                    const isSoldOut = opt.is_sold_out;
                                    return `
                                     <label class="modifier-option-row flex justify-between items-center p-3 bg-white border border-gray-150 rounded-2xl cursor-pointer hover:bg-gray-50 transition select-none ${isSoldOut ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''}">
                                         <div class="flex items-center gap-3 min-w-0 flex-grow">
                                             <input type="${isSingleSelect ? 'radio' : 'checkbox'}" 
                                                    name="group-${group.id}" 
                                                    class="modifier-input h-4.5 w-4.5 text-[#007AFF] border-gray-300 focus:ring-0 focus:outline-none shrink-0 ${isSingleSelect ? 'rounded-full' : 'rounded'}"
                                                    data-option-id="${opt.id}"
                                                    data-name-th="${opt.name_th}"
                                                    data-name-en="${opt.name_en || ''}"
                                                    data-price-cents="${opt.price_cents}"
                                                    ${isSoldOut ? 'disabled' : ''}>
                                             ${opt.image_url ? `<img src="${opt.image_url}" class="w-10 h-10 object-cover rounded-xl border border-gray-150 shrink-0">` : ''}
                                             <div class="flex flex-col min-w-0">
                                                 <span class="text-xs font-bold text-gray-800 truncate">${opt.name_th} ${isSoldOut ? '<span class="text-[#FF3B30] text-[9px] font-bold bg-[#FFEAEA] px-1.5 py-0.5 rounded-full ml-1 select-none inline-block">หมด</span>' : ''}</span>
                                                 <span class="text-[10px] text-gray-400 font-medium truncate">${opt.name_en || ''}</span>
                                             </div>
                                         </div>
                                         <span class="text-xs font-bold text-gray-900 shrink-0 ml-2">+${Utils.formatCurrency(opt.price_cents)}</span>
                                     </label>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;

        // Handle Confirmation
        const handleConfirm = () => {
            const blocks = message.querySelectorAll('.modifier-group-block');
            const selectedOptions = [];
            let isValid = true;

            blocks.forEach(block => {
                const groupId = block.dataset.groupId;
                const min = parseInt(block.dataset.min) || 0;
                const max = parseInt(block.dataset.max) || 999;
                const groupName = block.dataset.name;

                const checkedInputs = block.querySelectorAll('.modifier-input:checked');
                const selectedCount = checkedInputs.length;

                if (selectedCount < min) {
                    alert(`กรุณาเลือกในกลุ่ม "${groupName}" อย่างน้อย ${min} ตัวเลือก`);
                    isValid = false;
                    return;
                }

                if (selectedCount > max) {
                    alert(`ในกลุ่ม "${groupName}" สามารถเลือกได้สูงสุดไม่เกิน ${max} ตัวเลือก`);
                    isValid = false;
                    return;
                }

                checkedInputs.forEach(input => {
                    selectedOptions.push({
                        id: input.dataset.optionId,
                        name_th: input.dataset.nameTh,
                        name_en: input.dataset.nameEn,
                        price_cents: parseInt(input.dataset.priceCents) || 0
                    });
                });
            });

            if (!isValid) return;

            // Cleanup confirm handler to avoid double-binding
            btnConfirm.removeEventListener('click', handleConfirm);
            modal.classList.add('hidden');

            if (onConfirm) onConfirm(selectedOptions);
        };

        // Bind Confirmation Click
        btnConfirm.onclick = handleConfirm;

        modal.classList.remove('hidden');
    }
}
