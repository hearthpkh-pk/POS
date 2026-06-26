import { Utils } from '../utils.js';

export class AdminDashboardView {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.onDateRangeChange = null;
        this.selectedStartDate = null;
        this.selectedEndDate = null;
        this.flatpickrInstance = null;
    }

    render(dashboardData, startDate, endDate) {
        if (!this.container) return;

        if (!dashboardData) {
            this.container.innerHTML = `<div class="p-6 text-center text-gray-500">กำลังโหลดแดชบอร์ด...</div>`;
            return;
        }

        this.selectedStartDate = startDate;
        this.selectedEndDate = endDate;

        const { totalOrders, totalRevenueBaht, averageOrderBaht } = dashboardData;

        const html = `
        <div class="p-4 lg:p-6 h-full overflow-y-auto custom-scroll bg-[#F2F2F7]">
            <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-3">
                <div>
                    <h2 class="text-xl font-bold text-gray-900 leading-tight">แดชบอร์ดภาพรวม</h2>
                    <p class="text-xs text-gray-500 mt-1">สรุปยอดขาย ประสิทธิภาพ และข้อมูลสถิติสำคัญ</p>
                </div>
                <div class="flex items-center bg-white px-3 py-2 w-full sm:w-auto border border-gray-150 shadow-sm rounded-xl">
                    <i class="fas fa-calendar-alt text-[#007AFF] mr-2"></i>
                    <input type="text" id="dashboard-date-range" placeholder="เลือกช่วงวันที่" class="border-none focus:ring-0 text-sm font-semibold text-gray-800 w-full sm:w-56 bg-transparent focus:outline-none cursor-pointer" readonly>
                </div>
            </div>
            
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6 mb-8">
                ${this.renderMetricCard('fas fa-sack-dollar', 'รายได้รวม (ช่วงที่เลือก)', totalRevenueBaht, 'บาท', 'text-[#34C759]', 'bg-[#E8F5E9]')}
                ${this.renderMetricCard('fas fa-receipt', 'ออเดอร์ (ช่วงที่เลือก)', totalOrders, 'ออเดอร์', 'text-[#007AFF]', 'bg-[#E3F2FD]')}
                ${this.renderMetricCard('fas fa-chart-line', 'AOV (เฉลี่ยต่อบิล)', averageOrderBaht, 'บาท/บิล', 'text-[#FF9500]', 'bg-[#FFF3E0]')}
            </div>

            <!-- Dashboard Analytics Chart/Detail Placeholder -->
            <div class="bg-white p-8 text-center border border-gray-100 shadow-sm rounded-2xl flex flex-col items-center justify-center min-h-[220px]">
                <div class="w-12 h-12 rounded-full bg-[#F2F2F7] flex items-center justify-center text-gray-400 mb-3">
                    <i class="fas fa-chart-pie text-lg"></i>
                </div>
                <h4 class="text-sm font-bold text-gray-800 mb-1">รายงานยอดขายแยกตามหมวดหมู่</h4>
                <p class="text-xs text-gray-500 max-w-sm">ข้อมูลและกราฟเปรียบเทียบในแต่ละหมวดหมู่เมนูอาหารและเครื่องดื่ม จะแสดงผลที่นี่ในรุ่นถัดไป</p>
            </div>
        </div>
        `;

        this.container.innerHTML = html;
        this.initFlatpickr();
    }

    initFlatpickr() {
        const input = document.getElementById('dashboard-date-range');
        if (!input) return;

        if (this.flatpickrInstance) {
            this.flatpickrInstance.destroy();
        }

        const self = this;
        this.flatpickrInstance = flatpickr(input, {
            mode: 'range',
            locale: 'th',
            dateFormat: 'Y-m-d',
            defaultDate: [this.selectedStartDate, this.selectedEndDate],
            onClose: function(selectedDates, dateStr, instance) {
                if (selectedDates.length === 2) {
                    const startStr = instance.formatDate(selectedDates[0], 'Y-m-d');
                    const endStr = instance.formatDate(selectedDates[1], 'Y-m-d');
                    if (self.onDateRangeChange) {
                        self.onDateRangeChange(startStr, endStr);
                    }
                }
            }
        });
    }

    renderMetricCard(icon, title, value, unit, iconColor, bgColor) {
        return `
        <div class="bg-white p-5 flex items-center space-x-4 border border-gray-100 shadow-sm rounded-2xl">
          <div class="p-3 rounded-2xl ${bgColor} ${iconColor} text-lg w-12 h-12 flex items-center justify-center shrink-0">
            <i class="${icon}"></i>
          </div>
          <div>
            <p class="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">${title}</p>
            <p class="text-2xl font-black text-gray-900 mt-1">${value}</p>
            <p class="text-[10px] text-gray-400 font-medium mt-0.5">${unit}</p>
          </div>
        </div>
      `;
    }
}
