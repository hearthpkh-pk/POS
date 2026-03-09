import { Utils } from '../utils.js';

export class AdminMenuView {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
    }

    render(menuTree = [], editingMenuId = null) {
        if (!this.container) return;

        // Build flat array for list view if necessary, or just use tree
        const flatMenu = menuTree;

        const editingItem = editingMenuId ? flatMenu.find(m => m.id === editingMenuId) : null;

        const html = `
        <div class="p-4 lg:p-6 h-full overflow-y-auto custom-scroll bg-gray-100">
            <h2 class="text-2xl font-black text-gray-800 mb-6">จัดการเมนู</h2>
            <div class="bg-white p-4 lg:p-6 rounded-xl shadow-sm border mb-8">
                <h3 id="menu-form-title" class="text-xl font-bold text-gray-800 mb-4">${editingItem ? 'แก้ไขเมนู: ' + editingItem.name_th : 'เพิ่มเมนูใหม่'}</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700">ชื่อไทย</label>
                        <input type="text" id="m-name-th" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 focus:ring-orange-500 focus:border-orange-500" placeholder="เช่น: ทาโก้ อัล ปาสตอร์" value="${editingItem ? editingItem.name_th : ''}">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">ชื่ออังกฤษ</label>
                        <input type="text" id="m-name-en" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 focus:ring-orange-500 focus:border-orange-500" placeholder="เช่น: Tacos al Pastor" value="${editingItem ? (editingItem.name_en || '') : ''}">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">ราคา (บาท)</label>
                        <input type="number" id="m-price" min="0.01" step="0.01" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 focus:ring-orange-500 focus:border-orange-500" placeholder="95.00" value="${editingItem ? Utils.centsToBaht(editingItem.base_price_cents) : ''}">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">หมวดหมู่</label>
                        <select id="m-cat" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 focus:ring-orange-500 focus:border-orange-500">
                            <!-- Needs to be dynamically populated from categories table ideally, hardcoded for now -->
                            <option value="อาหาร">อาหาร</option>
                            <option value="เครื่องดื่ม">เครื่องดื่ม</option>
                            <option value="อื่นๆ">อื่นๆ</option>
                        </select>
                    </div>
                </div>
                <div class="flex space-x-3 mt-6 justify-end">
                    <button id="btn-cancel-menu" class="${editingItem ? '' : 'hidden'} px-6 py-2 rounded font-bold text-gray-700 hover:bg-gray-100 w-full sm:w-auto">ยกเลิก</button>
                    <button id="btn-save-menu" class="${editingItem ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-800 hover:bg-black'} text-white px-6 py-2 rounded font-bold shadow hover:shadow-md transition w-full sm:w-auto">
                        ${editingItem ? 'บันทึกการแก้ไข' : 'บันทึก'}
                    </button>
                </div>
            </div>
            
            <div class="bg-white p-4 lg:p-6 rounded-xl shadow-sm border">
                <h3 class="text-xl font-bold text-gray-800 mb-4">เมนูทั้งหมด (${flatMenu.length})</h3>
                <div class="space-y-3">
                    ${flatMenu.length === 0 ? '<div class="text-center text-gray-500 py-4">ไม่พบข้อมูลเมนู</div>' : flatMenu.map(item => `
                        <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg border hover:border-orange-300 transition group">
                            <div class="flex-grow">
                                <div class="font-bold text-gray-800 group-hover:text-orange-700 transition text-sm sm:text-base">
                                    ${item.name_th} <span class="text-xs text-gray-400 font-normal ml-1">(${item.categories?.name_th || 'N/A'})</span>
                                </div>
                                <div class="text-xs sm:text-sm text-gray-600">${Utils.formatCurrency(item.base_price_cents)}</div>
                            </div>
                            <div class="flex space-x-2 opacity-100 lg:opacity-0 group-hover:opacity-100 transition">
                                <button data-action="edit-menu" data-id="${item.id}" title="แก้ไข" class="text-blue-600 hover:text-blue-800 p-2 rounded-full bg-blue-50 hover:bg-blue-100">
                                    <i class="fas fa-pen text-sm pointer-events-none"></i>
                                </button>
                                <button data-action="delete-menu" data-id="${item.id}" title="ลบ" class="text-red-600 hover:text-red-800 p-2 rounded-full bg-red-50 hover:bg-red-100">
                                    <i class="fas fa-trash text-sm pointer-events-none"></i>
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;

        this.container.innerHTML = html;
    }
}
