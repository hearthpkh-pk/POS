import { supabase } from '../../../core/SupabaseClient.js';
import { Utils } from '../../../utils.js';

export class AdminModifiersModal {
    static show(modifierGroups, callbacks) {
        const modal = document.getElementById('custom-modal');
        const title = document.getElementById('modal-title');
        const message = document.getElementById('modal-message');
        const btnConfirm = document.getElementById('modal-confirm-btn');
        const btnCancel = document.getElementById('modal-cancel-btn');

        if (!modal) return;

        title.textContent = 'จัดการตัวเลือกเสริมส่วนกลาง';
        btnCancel.classList.remove('hidden');
        btnCancel.textContent = 'ปิด';
        btnConfirm.classList.add('hidden');
        
        message.innerHTML = `
            <div class="w-full bg-white flex flex-col">
                <!-- Add Form -->
                <div class="p-4 bg-white border-b border-gray-150 flex flex-col gap-3 text-left">
                    <div class="text-xs font-bold text-gray-400 uppercase tracking-wider">เพิ่มกลุ่มตัวเลือกเสริมใหม่</div>
                    <div class="grid grid-cols-2 gap-2">
                        <div>
                            <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">ชื่อภาษาไทย</label>
                            <input type="text" id="new-mod-name-th" class="w-full rounded-xl border border-gray-200/80 bg-[#F2F2F7] px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#007AFF] transition" placeholder="เช่น เลือกเนื้อสัตว์">
                        </div>
                        <div>
                            <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">ชื่อภาษาอังกฤษ</label>
                            <input type="text" id="new-mod-name-en" class="w-full rounded-xl border border-gray-200/80 bg-[#F2F2F7] px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#007AFF] transition" placeholder="เช่น Choose Meat">
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                        <div>
                            <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">เลือกได้ขั้นต่ำ (Min)</label>
                            <input type="number" id="new-mod-min" class="w-full rounded-xl border border-gray-200/80 bg-[#F2F2F7] px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#007AFF] transition text-center" placeholder="เช่น 0" value="0">
                        </div>
                        <div>
                            <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">เลือกได้สูงสุด (Max)</label>
                            <input type="number" id="new-mod-max" class="w-full rounded-xl border border-gray-200/80 bg-[#F2F2F7] px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#007AFF] transition text-center" placeholder="เช่น 1" value="1">
                        </div>
                    </div>
                    <button id="btn-add-modifier-group" class="w-full bg-[#34C759] hover:bg-green-600 text-white font-bold rounded-xl text-xs py-3.5 shadow-sm transition flex items-center justify-center gap-1">
                        <i class="fas fa-plus"></i> เพิ่มกลุ่มตัวเลือกเสริม
                    </button>
                </div>

                <!-- Groups list -->
                <div class="w-full bg-[#F2F2F7] p-4 flex flex-col gap-2 max-h-[40vh] overflow-y-auto custom-scroll text-left">
                    <div class="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">กลุ่มตัวเลือกเสริมทั้งหมด (${modifierGroups.length})</div>
                    ${modifierGroups.length === 0 
                        ? `<div class="text-center text-gray-400 py-6 text-xs italic bg-white border border-gray-100 rounded-xl">ยังไม่มีกลุ่มตัวเลือกเสริม</div>`
                        : modifierGroups.map(g => `
                            <div class="bg-white p-3.5 border border-gray-100 rounded-xl flex justify-between items-center gap-3">
                                <div class="flex-grow min-w-0">
                                    <div class="font-bold text-gray-900 text-sm truncate">${g.name_th}</div>
                                    <div class="text-xs text-gray-400 mt-0.5 truncate">${g.name_en || '-'} (เลือก: ${g.min_selection} - ${g.max_selection}) · ตัวเลือกย่อย: ${(g.modifier_options || []).filter(o => o.is_active).length} รายการ</div>
                                </div>
                                <div class="flex items-center gap-2 shrink-0">
                                    <button data-action="manage-options" data-id="${g.id}" class="text-[#007AFF] bg-[#007AFF]/5 hover:bg-[#007AFF]/10 px-2.5 py-1.5 rounded-lg text-xs font-bold transition">
                                        จัดการตัวเลือก
                                    </button>
                                    <button data-action="delete-modifier-group" data-id="${g.id}" class="text-gray-400 hover:text-[#FF3B30] p-2 hover:bg-[#FFEAEA] rounded-xl transition">
                                        <i class="fas fa-trash-alt text-xs pointer-events-none"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                </div>
            </div>
        `;

        AdminModifiersModal.bindModifierModalEvents(modifierGroups, callbacks);
        modal.classList.remove('hidden');
    }

    static bindModifierModalEvents(modifierGroups, callbacks) {
        const modal = document.getElementById('custom-modal');
        if (!modal) return;

        // Add Button
        const btnAdd = modal.querySelector('#btn-add-modifier-group');
        if (btnAdd) {
            btnAdd.addEventListener('click', () => {
                const nameTh = modal.querySelector('#new-mod-name-th').value.trim();
                const nameEn = modal.querySelector('#new-mod-name-en').value.trim();
                const min = modal.querySelector('#new-mod-min').value;
                const max = modal.querySelector('#new-mod-max').value;

                if (!nameTh) {
                    alert('กรุณากรอกชื่อไทยของกลุ่มตัวเลือกเสริม');
                    return;
                }

                if (callbacks.onSaveGroup) {
                    callbacks.onSaveGroup({
                        name_th: nameTh,
                        name_en: nameEn,
                        min_selection: min,
                        max_selection: max
                    });
                }
            });
        }

        // Delete Buttons
        const deleteBtns = modal.querySelectorAll('[data-action="delete-modifier-group"]');
        deleteBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบกลุ่มตัวเลือกเสริมนี้? (ตัวเลือกเสริมและลิงก์ของสินค้าจะถูกลบทั้งหมด)')) {
                    if (callbacks.onDeleteGroup) {
                        callbacks.onDeleteGroup(id);
                    }
                }
            });
        });

        // Manage Options Buttons
        const manageOptionsBtns = modal.querySelectorAll('[data-action="manage-options"]');
        manageOptionsBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                AdminModifiersModal.showModifierOptionsModal(id, modifierGroups, callbacks);
            });
        });
    }

    static showModifierOptionsModal(groupId, modifierGroups, callbacks) {
        const modal = document.getElementById('custom-modal');
        const title = document.getElementById('modal-title');
        const message = document.getElementById('modal-message');
        const btnConfirm = document.getElementById('modal-confirm-btn');
        const btnCancel = document.getElementById('modal-cancel-btn');

        if (!modal) return;

        const group = modifierGroups.find(g => g.id === groupId);
        if (!group) return;

        title.textContent = `จัดการตัวเลือก: ${group.name_th}`;
        btnCancel.classList.remove('hidden');
        btnCancel.textContent = 'ปิด';
        btnConfirm.classList.add('hidden');

        const options = (group.modifier_options || []).filter(o => o.is_active);

        message.innerHTML = `
            <div class="w-full bg-white flex flex-col">
                <!-- Back Button & Header -->
                <div class="p-3 bg-gray-50 border-b border-gray-150 flex items-center gap-2 text-left">
                    <button id="btn-back-to-groups" class="text-[#007AFF] hover:underline text-xs font-bold flex items-center gap-1">
                        <i class="fas fa-chevron-left"></i> ย้อนกลับไปกลุ่มตัวเลือก
                    </button>
                </div>

                <!-- Add Option Form -->
                <div class="p-4 bg-white border-b border-gray-150 flex flex-col gap-3 text-left">
                    <div class="text-xs font-bold text-gray-400 uppercase tracking-wider">เพิ่มตัวเลือกย่อยของกลุ่ม "${group.name_th}"</div>
                    <div class="grid grid-cols-4 gap-2">
                        <div class="col-span-1">
                            <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">ชื่อภาษาไทย</label>
                            <input type="text" id="new-opt-name-th" class="w-full rounded-xl border border-gray-200/80 bg-[#F2F2F7] px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#007AFF] transition" placeholder="เช่น ไก่">
                        </div>
                        <div class="col-span-1">
                            <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">ชื่อภาษาอังกฤษ</label>
                            <input type="text" id="new-opt-name-en" class="w-full rounded-xl border border-gray-200/80 bg-[#F2F2F7] px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#007AFF] transition" placeholder="เช่น Chicken">
                        </div>
                        <div class="col-span-1">
                            <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">ราคาบวกเพิ่ม (บาท)</label>
                            <input type="number" step="0.01" min="0" id="new-opt-price" class="w-full rounded-xl border border-gray-200/80 bg-[#F2F2F7] px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#007AFF] transition text-center" placeholder="เช่น 0.00" value="0.00">
                        </div>
                        <div class="col-span-1">
                            <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">รูปภาพ</label>
                            <div class="flex items-center gap-1.5 mt-0.5">
                                <button id="btn-upload-opt-img" class="flex-grow bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-700 text-[10px] font-bold py-2 rounded-xl transition flex items-center justify-center gap-1">
                                    <i class="fas fa-camera"></i> เลือก
                                </button>
                                <input type="file" id="new-opt-image-input" class="hidden" accept="image/*">
                                <img id="new-opt-image-preview" class="w-8 h-8 object-cover rounded-lg border border-gray-200 hidden">
                                <input type="hidden" id="new-opt-image-url" value="">
                            </div>
                        </div>
                    </div>
                    <button id="btn-add-modifier-option" class="w-full bg-[#34C759] hover:bg-green-600 text-white font-bold rounded-xl text-xs py-3.5 shadow-sm transition flex items-center justify-center gap-1">
                        <i class="fas fa-plus"></i> เพิ่มตัวเลือกย่อย
                    </button>
                </div>

                <!-- Options List -->
                <div class="w-full bg-[#F2F2F7] p-4 flex flex-col gap-2 max-h-[40vh] overflow-y-auto custom-scroll text-left">
                    <div class="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">ตัวเลือกย่อยทั้งหมด (${options.length})</div>
                    ${options.length === 0 
                        ? `<div class="text-center text-gray-400 py-6 text-xs italic bg-white border border-gray-100 rounded-xl">ยังไม่มีตัวเลือกย่อยในกลุ่มนี้</div>`
                        : options.map(o => {
                            const checkedAttr = o.is_sold_out ? '' : 'checked';
                            return `
                            <div class="bg-white border border-gray-150 rounded-2xl overflow-hidden" id="opt-card-${o.id}">
                                <!-- Display Row -->
                                <div class="p-3 flex justify-between items-center gap-3" id="opt-display-${o.id}">
                                    <div class="flex items-center gap-2.5 min-w-0 flex-grow">
                                        ${o.image_url ? `<img src="${o.image_url}" class="w-10 h-10 rounded-xl object-cover border border-gray-150 shrink-0">` : `
                                        <div class="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 border border-gray-150 shrink-0">
                                            <i class="fas fa-utensils text-xs"></i>
                                        </div>`}
                                        <div class="min-w-0">
                                            <div class="font-bold text-gray-900 text-sm truncate ${o.is_sold_out ? 'line-through text-gray-400' : ''}">${o.name_th}</div>
                                            <div class="text-xs text-gray-400 mt-0.5 truncate">${o.name_en || '-'} (ราคาเพิ่ม: +฿ ${Number(o.price_cents / 100).toFixed(2)})</div>
                                        </div>
                                    </div>
                                    <div class="flex items-center gap-2 shrink-0">
                                        <button data-action="edit-modifier-option" data-id="${o.id}" class="text-[#007AFF] bg-[#007AFF]/5 hover:bg-[#007AFF]/10 px-2 py-1.5 rounded-lg text-xs font-bold transition">
                                            <i class="fas fa-pen text-[10px] pointer-events-none"></i>
                                        </button>
                                        <div class="flex flex-col items-end">
                                            <span class="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-1 select-none">มีของ</span>
                                            <label class="ios-switch relative inline-flex items-center cursor-pointer select-none">
                                                <input type="checkbox" data-action="toggle-opt-soldout" data-id="${o.id}" class="sr-only peer" ${checkedAttr}>
                                                <div class="w-8 h-4.5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-350 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-[#34C759]"></div>
                                            </label>
                                        </div>
                                        <button data-action="delete-modifier-option" data-id="${o.id}" class="text-gray-400 hover:text-[#FF3B30] p-2 hover:bg-[#FFEAEA] rounded-xl transition">
                                            <i class="fas fa-trash-alt text-xs pointer-events-none"></i>
                                        </button>
                                    </div>
                                </div>
                                <!-- Edit Row (hidden by default) -->
                                <div class="hidden p-3 bg-[#F2F2F7] border-t border-gray-150" id="opt-edit-${o.id}">
                                    <div class="grid grid-cols-4 gap-2 mb-2">
                                        <div>
                                            <label class="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">ชื่อไทย</label>
                                            <input type="text" data-field="edit-name-th" data-id="${o.id}" class="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#007AFF]" value="${o.name_th}">
                                        </div>
                                        <div>
                                            <label class="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">ชื่ออังกฤษ</label>
                                            <input type="text" data-field="edit-name-en" data-id="${o.id}" class="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#007AFF]" value="${o.name_en || ''}">
                                        </div>
                                        <div>
                                            <label class="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">ราคาเพิ่ม (บาท)</label>
                                            <input type="number" step="0.01" min="0" data-field="edit-price" data-id="${o.id}" class="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#007AFF] text-center" value="${Number(o.price_cents / 100).toFixed(2)}">
                                        </div>
                                        <div>
                                            <label class="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">รูปภาพ</label>
                                            <div class="flex items-center gap-1.5 mt-0.5">
                                                <button data-action="upload-edit-img" data-id="${o.id}" class="flex-grow bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 text-[10px] font-bold py-1.5 rounded-lg transition flex items-center justify-center gap-0.5">
                                                    <i class="fas fa-camera"></i> เลือก
                                                </button>
                                                <input type="file" data-field="edit-image-input" data-id="${o.id}" class="hidden" accept="image/*">
                                                <img data-field="edit-image-preview" data-id="${o.id}" class="w-6 h-6 object-cover rounded border border-gray-250 ${o.image_url ? '' : 'hidden'}" src="${o.image_url || ''}">
                                                <input type="hidden" data-field="edit-image-url" data-id="${o.id}" value="${o.image_url || ''}">
                                            </div>
                                        </div>
                                    </div>
                                    <div class="flex gap-2">
                                        <button data-action="save-edit-option" data-id="${o.id}" class="flex-1 bg-[#007AFF] hover:bg-blue-600 text-white font-bold rounded-lg text-xs py-2 transition">บันทึก</button>
                                        <button data-action="cancel-edit-option" data-id="${o.id}" class="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-lg text-xs py-2 transition">ยกเลิก</button>
                                    </div>
                                </div>
                            </div>
                            `;
                        }).join('')}
                </div>
            </div>
        `;

        AdminModifiersModal.bindModifierOptionsModalEvents(groupId, modifierGroups, callbacks);
    }

    static bindModifierOptionsModalEvents(groupId, modifierGroups, callbacks) {
        const modal = document.getElementById('custom-modal');
        if (!modal) return;

        // Back Button
        const btnBack = modal.querySelector('#btn-back-to-groups');
        if (btnBack) {
            btnBack.addEventListener('click', () => {
                AdminModifiersModal.show(modifierGroups, callbacks);
            });
        }

        // Add Image Upload handlers
        const btnUpload = modal.querySelector('#btn-upload-opt-img');
        const imgInput = modal.querySelector('#new-opt-image-input');
        const imgPreview = modal.querySelector('#new-opt-image-preview');
        const imgUrlHidden = modal.querySelector('#new-opt-image-url');

        if (btnUpload && imgInput) {
            btnUpload.addEventListener('click', () => imgInput.click());

            imgInput.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (!file) return;

                try {
                    btnUpload.textContent = 'กำลังอัป...';
                    btnUpload.disabled = true;

                    const compressedFile = await Utils.compressImage(file, {
                        maxWidth: 600,
                        maxHeight: 600,
                        quality: 0.8
                    });

                    const ext = compressedFile.name.split('.').pop();
                    const filename = `mod_${Date.now()}.${ext}`;

                    const { error: uploadError } = await supabase.storage
                        .from('restaurant-images')
                        .upload(filename, compressedFile, { upsert: true, contentType: compressedFile.type });

                    if (uploadError) throw uploadError;

                    const { data: urlData } = supabase.storage
                        .from('restaurant-images')
                        .getPublicUrl(filename);

                    imgUrlHidden.value = urlData.publicUrl;
                    if (imgPreview) {
                        imgPreview.src = urlData.publicUrl;
                        imgPreview.classList.remove('hidden');
                    }
                    btnUpload.innerHTML = '<i class="fas fa-check"></i> เสร็จ';
                } catch (err) {
                    console.error("Option image upload failed:", err);
                    alert("อัปโหลดรูปภาพตัวเลือกไม่สำเร็จ: " + err.message);
                    btnUpload.innerHTML = '<i class="fas fa-camera"></i> เลือก';
                } finally {
                    btnUpload.disabled = false;
                }
            });
        }

        // Add Button
        const btnAdd = modal.querySelector('#btn-add-modifier-option');
        if (btnAdd) {
            btnAdd.addEventListener('click', () => {
                const nameTh = modal.querySelector('#new-opt-name-th').value.trim();
                const nameEn = modal.querySelector('#new-opt-name-en').value.trim();
                const price = Number(modal.querySelector('#new-opt-price').value) || 0;
                const imageUrl = modal.querySelector('#new-opt-image-url').value;

                if (!nameTh) {
                    alert('กรุณากรอกชื่อไทยของตัวเลือกเสริม');
                    return;
                }

                if (callbacks.onSaveOption) {
                    callbacks.onSaveOption({
                        modifier_group_id: groupId,
                        name_th: nameTh,
                        name_en: nameEn,
                        price_cents: Math.round(price * 100),
                        image_url: imageUrl || null
                    });
                }
            });
        }

        // Delete Buttons
        const deleteBtns = modal.querySelectorAll('[data-action="delete-modifier-option"]');
        deleteBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบตัวเลือกเสริมนี้?')) {
                    if (callbacks.onDeleteOption) {
                        callbacks.onDeleteOption(id, groupId);
                    }
                }
            });
        });

        // Toggle Soldout Switches
        const soldoutToggles = modal.querySelectorAll('[data-action="toggle-opt-soldout"]');
        soldoutToggles.forEach(toggle => {
            toggle.addEventListener('change', () => {
                const id = toggle.dataset.id;
                const isSoldOut = !toggle.checked;
                if (callbacks.onToggleOptionSoldOut) {
                    callbacks.onToggleOptionSoldOut(id, isSoldOut, groupId);
                }
            });
        });

        // Edit Option Buttons — show inline edit form
        const editBtns = modal.querySelectorAll('[data-action="edit-modifier-option"]');
        editBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                const editRow = modal.querySelector(`#opt-edit-${id}`);
                if (editRow) editRow.classList.toggle('hidden');
            });
        });

        // Cancel Edit Buttons
        const cancelEditBtns = modal.querySelectorAll('[data-action="cancel-edit-option"]');
        cancelEditBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                const editRow = modal.querySelector(`#opt-edit-${id}`);
                if (editRow) editRow.classList.add('hidden');
            });
        });

        // Edit Image Upload listeners
        const editUploadBtns = modal.querySelectorAll('[data-action="upload-edit-img"]');
        editUploadBtns.forEach(btn => {
            const id = btn.dataset.id;
            const input = modal.querySelector(`[data-field="edit-image-input"][data-id="${id}"]`);
            const preview = modal.querySelector(`[data-field="edit-image-preview"][data-id="${id}"]`);
            const hidden = modal.querySelector(`[data-field="edit-image-url"][data-id="${id}"]`);

            if (btn && input) {
                btn.addEventListener('click', () => input.click());

                input.addEventListener('change', async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;

                    try {
                        btn.textContent = 'อัป...';
                        btn.disabled = true;

                        const compressedFile = await Utils.compressImage(file, {
                            maxWidth: 600,
                            maxHeight: 600,
                            quality: 0.8
                        });

                        const ext = compressedFile.name.split('.').pop();
                        const filename = `mod_${Date.now()}.${ext}`;

                        const { error: uploadError } = await supabase.storage
                            .from('restaurant-images')
                            .upload(filename, compressedFile, { upsert: true, contentType: compressedFile.type });

                        if (uploadError) throw uploadError;

                        const { data: urlData } = supabase.storage
                            .from('restaurant-images')
                            .getPublicUrl(filename);

                        hidden.value = urlData.publicUrl;
                        if (preview) {
                            preview.src = urlData.publicUrl;
                            preview.classList.remove('hidden');
                        }
                        btn.innerHTML = '<i class="fas fa-check"></i>';
                    } catch (err) {
                        console.error("Edit option image upload failed:", err);
                        alert("อัปโหลดรูปภาพแก้ไขตัวเลือกไม่สำเร็จ: " + err.message);
                        btn.innerHTML = '<i class="fas fa-camera"></i> เลือก';
                    } finally {
                        btn.disabled = false;
                    }
                });
            }
        });

        // Save Edit Buttons — call onUpdateOption callback
        const saveEditBtns = modal.querySelectorAll('[data-action="save-edit-option"]');
        saveEditBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                const nameTh = modal.querySelector(`[data-field="edit-name-th"][data-id="${id}"]`).value.trim();
                const nameEn = modal.querySelector(`[data-field="edit-name-en"][data-id="${id}"]`).value.trim();
                const price = Number(modal.querySelector(`[data-field="edit-price"][data-id="${id}"]`).value) || 0;
                const imageUrl = modal.querySelector(`[data-field="edit-image-url"][data-id="${id}"]`).value;

                if (!nameTh) {
                    alert('กรุณากรอกชื่อไทยของตัวเลือกเสริม');
                    return;
                }

                if (callbacks.onUpdateOption) {
                    callbacks.onUpdateOption(id, {
                        name_th: nameTh,
                        name_en: nameEn,
                        price_cents: Math.round(price * 100),
                        image_url: imageUrl || null
                    }, groupId);
                }
            });
        });
    }
}
