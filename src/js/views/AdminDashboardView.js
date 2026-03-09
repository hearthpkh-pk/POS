import { Utils } from '../utils.js';

export class AdminDashboardView {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
    }

    render(dashboardData) {
        if (!this.container) return;

        if (!dashboardData) {
            this.container.innerHTML = `<div class="p-6 text-center text-gray-500">กำลังโหลดแดชบอร์ด...</div>`;
            return;
        }

        const { totalOrders, totalRevenueBaht, averageOrderBaht } = dashboardData;

        const html = `
        <div class="p-4 lg:p-6 h-full overflow-y-auto custom-scroll bg-gray-100">
            <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6">
                <h2 class="text-2xl font-black text-gray-800 mb-2 sm:mb-0">แดชบอร์ดภาพรวม</h2>
                <div class="flex items-center bg-white p-2 rounded-lg shadow-sm border w-full sm:w-auto">
                    <i class="fas fa-calendar-alt text-gray-500 ml-2 mr-2"></i>
                    <input type="text" id="dashboard-date-range" placeholder="เลือกช่วงวันที่" class="border-none focus:ring-0 text-sm font-medium text-gray-700 w-full sm:w-64" readonly>
                </div>
            </div>
            
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6 mb-8">
                ${this.renderMetricCard('fas fa-sack-dollar', 'รายได้รวม (ช่วงที่เลือก)', totalRevenueBaht, 'บาท', 'text-green-600', 'bg-green-50')}
                ${this.renderMetricCard('fas fa-receipt', 'ออเดอร์ (ช่วงที่เลือก)', totalOrders, 'ออเดอร์', 'text-blue-600', 'bg-blue-50')}
                ${this.renderMetricCard('fas fa-chart-line', 'AOV (เฉลี่ยต่อบิล)', averageOrderBaht, 'บาท/บิล', 'text-purple-600', 'bg-purple-50')}
            </div>

            <div class="bg-white p-4 lg:p-6 rounded-xl shadow-sm border mt-4 text-center text-gray-500">
                // พื้นที่สำหรับกร๊าฟ หรือยอดขายตามหมวดหมู่ จะทำใน Phase ถัดๆไป
            </div>
        </div>
    `;

        this.container.innerHTML = html;
    }

    renderMetricCard(icon, title, value, unit, iconColor, bgColor) {
        return `
        <div class="bg-white p-4 lg:p-6 rounded-xl shadow-md border flex items-start space-x-4">
          <div class="p-3 rounded-full ${bgColor} ${iconColor} text-xl">
            <i class="${icon}"></i>
          </div>
          <div>
            <p class="text-xs sm:text-sm font-medium text-gray-500">${title}</p>
            <p class="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">${value}</p>
            <p class="text-[10px] sm:text-xs text-gray-400 mt-1">${unit}</p>
          </div>
        </div>
      `;
    }
}
