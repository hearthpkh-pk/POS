import { Utils } from '../utils.js';

export class AdminHistoryView {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
    }

    render(orders = []) {
        if (!this.container) return;

        const html = `
        <div class="p-4 lg:p-6 h-full overflow-y-auto custom-scroll bg-gray-100">
            <h2 class="text-2xl font-black text-gray-800 mb-6">ประวัติการขาย</h2>
            <div class="bg-white p-4 lg:p-6 rounded-xl shadow-sm border">
                <h3 class="text-xl font-bold text-gray-800 mb-4">รายการออเดอร์ที่ชำระแล้ว</h3>
                <div class="overflow-x-auto rounded-lg border">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr class="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <th class="px-4 lg:px-6 py-3 text-left">ใบเสร็จ / โต๊ะ / เวลา</th>
                                <th class="px-4 lg:px-6 py-3 text-left">จำนวน</th>
                                <th class="px-4 lg:px-6 py-3 text-right">ยอดรวม (บาท)</th>
                                <th class="px-4 lg:px-6 py-3 text-center">ดูย้อนหลัง</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            ${orders.length === 0
                ? `<tr><td colspan="4" class="px-6 py-4 text-center text-gray-500 italic">ยังไม่มีประวัติการขาย</td></tr>`
                : orders.map(o => `
                                    <tr class="hover:bg-gray-50 transition">
                                        <td class="px-4 lg:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            ${o.order_no} <span class="text-gray-400">(${o.table_id || '-'})</span><br>
                                            <span class="text-xs text-gray-500">${Utils.formatDateTime(o.created_at)}</span>
                                        </td>
                                        <td class="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-500">${o.order_items?.length || 0} รายการ</td>
                                        <td class="px-4 lg:px-6 py-4 whitespace-nowrap text-sm font-bold text-right text-green-600">${Utils.formatCurrency(o.total_net_cents)}</td>
                                        <td class="px-4 lg:px-6 py-4 whitespace-nowrap text-center">
                                            <button data-action="view-receipt" data-id="${o.id}" class="text-blue-600 hover:text-blue-800 text-sm font-medium inline-flex items-center">
                                                <i class="fas fa-print mr-1 pointer-events-none"></i> <span class="hidden sm:inline pointer-events-none">ดูใบเสร็จ</span>
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
    }
}
