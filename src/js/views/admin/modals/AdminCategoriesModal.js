export class AdminCategoriesModal {
    static show(categories, callbacks) {
        const modal = document.getElementById('custom-modal');
        const title = document.getElementById('modal-title');
        const message = document.getElementById('modal-message');
        const btnConfirm = document.getElementById('modal-confirm-btn');
        const btnCancel = document.getElementById('modal-cancel-btn');

        if (!modal) return;

        title.textContent = 'จัดการหมวดหมู่สินค้า';
        btnCancel.classList.remove('hidden');
        btnCancel.textContent = 'ปิด';
        btnConfirm.classList.add('hidden');

        message.innerHTML = `
            <div class="w-full bg-white flex flex-col">
                <!-- Add Form -->
                <div class="p-4 bg-white border-b border-gray-150 flex flex-col gap-3 text-left">
                    <div class="text-xs font-bold text-gray-400 uppercase tracking-wider">เพิ่มหมวดหมู่ใหม่</div>
                    <div class="grid grid-cols-2 gap-2">
                        <div>
                            <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">ชื่อภาษาไทย</label>
                            <input type="text" id="new-cat-name-th" class="w-full rounded-xl border border-gray-200/80 bg-[#F2F2F7] px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#007AFF] transition" placeholder="เช่น อาหารจานเดียว">
                        </div>
                        <div>
                            <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">ชื่อภาษาอังกฤษ</label>
                            <input type="text" id="new-cat-name-en" class="w-full rounded-xl border border-gray-200/80 bg-[#F2F2F7] px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#007AFF] transition" placeholder="เช่น Main Dishes">
                        </div>
                    </div>
                    <div class="flex gap-2 items-end">
                        <div class="flex-shrink-0">
                            <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">ลำดับแสดงผล</label>
                            <input type="number" id="new-cat-sort" class="w-20 rounded-xl border border-gray-200/80 bg-[#F2F2F7] px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#007AFF] transition text-center" placeholder="ลำดับ" value="${categories.length + 1}">
                        </div>
                        <button id="btn-add-category-modal" class="flex-grow bg-[#34C759] hover:bg-green-600 text-white font-bold rounded-xl text-xs py-3.5 shadow-sm transition flex items-center justify-center gap-1">
                            <i class="fas fa-plus"></i> เพิ่มหมวดหมู่
                        </button>
                    </div>
                </div>

                <!-- Categories list -->
                <div class="w-full bg-[#F2F2F7] p-4 flex flex-col gap-2 max-h-[40vh] overflow-y-auto custom-scroll text-left">
                    <div class="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">หมวดหมู่ทั้งหมด (${categories.length})</div>
                    ${categories.length === 0 
                        ? `<div class="text-center text-gray-400 py-6 text-xs italic bg-white border border-gray-100 rounded-xl">ยังไม่มีหมวดหมู่</div>`
                        : categories.map(c => `
                            <div class="bg-white p-3.5 border border-gray-100 rounded-xl flex justify-between items-center gap-3">
                                <div class="flex-grow min-w-0">
                                    <div class="font-bold text-gray-900 text-sm truncate">${c.name_th}</div>
                                    <div class="text-xs text-gray-400 mt-0.5 truncate">${c.name_en || '-'} · ลำดับการแสดงผล: ${c.sort_order}</div>
                                </div>
                                <button data-action="delete-category" data-id="${c.id}" class="text-gray-400 hover:text-[#FF3B30] p-2 hover:bg-[#FFEAEA] rounded-xl transition shrink-0">
                                    <i class="fas fa-trash-alt text-xs pointer-events-none"></i>
                                </button>
                            </div>
                        `).join('')}
                </div>
            </div>
        `;

        AdminCategoriesModal.bindCategoryModalEvents(categories, callbacks);
        modal.classList.remove('hidden');
    }

    static bindCategoryModalEvents(categories, callbacks) {
        const modal = document.getElementById('custom-modal');
        if (!modal) return;

        // Add Button
        const btnAdd = modal.querySelector('#btn-add-category-modal');
        if (btnAdd) {
            btnAdd.addEventListener('click', () => {
                const nameTh = modal.querySelector('#new-cat-name-th').value.trim();
                const nameEn = modal.querySelector('#new-cat-name-en').value.trim();
                const sortOrder = parseInt(modal.querySelector('#new-cat-sort').value) || (categories.length + 1);

                if (!nameTh) {
                    alert('กรุณากรอกชื่อไทยของหมวดหมู่');
                    return;
                }

                if (callbacks.onSave) {
                    callbacks.onSave({
                        name_th: nameTh,
                        name_en: nameEn,
                        sort_order: sortOrder
                    });
                }
            });
        }

        // Delete Buttons
        const deleteBtns = modal.querySelectorAll('[data-action="delete-category"]');
        deleteBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบหมวดหมู่นี้? (เมนูอาหารในหมวดหมู่นี้จะไม่ถูกลบ แต่จะไปอยู่ในกลุ่มอื่นๆ)')) {
                    if (callbacks.onDelete) {
                        callbacks.onDelete(id);
                    }
                }
            });
        });
    }
}
