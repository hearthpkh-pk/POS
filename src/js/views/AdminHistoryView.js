import { Utils } from '../utils.js';

export class AdminHistoryView {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
    }

    render(orders = []) {
        if (!this.container) return;

        const totalSalesCents = orders.reduce((sum, o) => sum + (o.total_net_cents || 0), 0);
        const totalCount = orders.length;

        const html = `
        <div class="p-4 lg:p-6 h-full overflow-y-auto custom-scroll bg-[#F2F2F7]">
            <div class="mb-6">
                <h2 class="text-xl font-bold text-gray-900 leading-tight">ประวัติการขาย</h2>
                <p class="text-xs text-gray-500 mt-1">ดูรายการใบเสร็จและยอดขายย้อนหลัง</p>
            </div>

            <!-- Mini Summary Row -->
            <div class="grid grid-cols-2 gap-4 mb-6">
                <div class="bg-white p-4 border border-gray-150 shadow-sm rounded-xl flex flex-col justify-between">
                    <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">ออเดอร์ทั้งหมด</span>
                    <span class="text-2xl font-black text-gray-900 mt-2">${totalCount} รายการ</span>
                </div>
                <div class="bg-white p-4 border border-gray-150 shadow-sm rounded-xl flex flex-col justify-between">
                    <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">ยอดขายรวม</span>
                    <span class="text-2xl font-black text-[#34C759] mt-2">฿${Utils.formatCurrency(totalSalesCents)}</span>
                </div>
            </div>

            <div class="bg-white p-4 lg:p-6 border border-gray-150 shadow-sm rounded-2xl">
                <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">รายการออเดอร์ที่ชำระแล้ว</h3>
                
                <div class="overflow-x-auto rounded-xl border border-gray-150 shadow-sm">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-[#F2F2F7]">
                            <tr class="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                <th class="px-4 lg:px-6 py-3 text-left">ใบเสร็จ / โต๊ะ / เวลา</th>
                                <th class="px-4 lg:px-6 py-3 text-left">จำนวนสินค้า</th>
                                <th class="px-4 lg:px-6 py-3 text-right">ยอดรวม (บาท)</th>
                                <th class="px-4 lg:px-6 py-3 text-center">ดูย้อนหลัง</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-150">
                            ${orders.length === 0
                                ? `<tr><td colspan="4" class="px-6 py-8 text-center text-gray-400 italic text-xs">ยังไม่มีประวัติการขาย</td></tr>`
                                : orders.map(o => `
                                    <tr class="hover:bg-[#F2F2F7]/50 transition">
                                        <td class="px-4 lg:px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-950">
                                            <span class="font-mono text-gray-900">${o.order_no}</span> 
                                            ${o.table_id ? `<span class="text-xs bg-[#E3F2FD] text-[#007AFF] px-2 py-0.5 rounded-full font-bold ml-1">${o.table_id}</span>` : ''}
                                            <br>
                                            <span class="text-[10px] text-gray-400 font-medium">${Utils.formatDateTime(o.created_at)}</span>
                                        </td>
                                        <td class="px-4 lg:px-6 py-4 whitespace-nowrap text-xs text-gray-500 font-semibold">
                                            ${o.order_items?.length || 0} รายการ
                                        </td>
                                        <td class="px-4 lg:px-6 py-4 whitespace-nowrap text-sm font-bold text-right text-[#34C759]">
                                            ${Utils.formatCurrency(o.total_net_cents)}
                                        </td>
                                        <td class="px-4 lg:px-6 py-4 whitespace-nowrap text-center">
                                            <button data-action="view-receipt" data-id="${o.id}" class="ios-action-btn ios-btn-secondary px-3 py-1.5 text-xs font-semibold inline-flex items-center gap-1 shadow-sm">
                                                <i class="fas fa-print mr-0.5 pointer-events-none"></i> <span class="pointer-events-none">ดูใบเสร็จ</span>
                                            </button>
                                        </td>
                                    </tr>`).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        `;

        this.container.innerHTML = html;
        this.bindEvents(orders);
    }

    bindEvents(orders) {
        this.container.querySelectorAll('[data-action="view-receipt"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = btn.dataset.id;
                const order = orders.find(o => o.id === id);
                if (order) {
                    import('./pos/modals/POSReceiptModal.js').then(module => {
                        module.POSReceiptModal.show(order.table_id || 'ออเดอร์ทั่วไป', order);
                    }).catch(err => {
                        console.error("Failed to load POSReceiptModal:", err);
                    });
                }
            });
        });
    }
}
