import { supabase } from '../core/SupabaseClient.js';
import { Utils } from '../utils.js';

export class AdminPreordersView {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.reservations = [];
        this.onImportCallback = null;
    }

    setOnImport(callback) {
        this.onImportCallback = callback;
    }

    async fetchPreorders() {
        try {
            // Fetch all guest reservations sorted by reservation time
            const { data, error } = await supabase
                .from('guest_reservations')
                .select('*')
                .order('reservation_time', { ascending: true });

            if (error) throw error;
            this.reservations = data || [];
        } catch (error) {
            console.error('Error fetching pre-orders:', error);
            this.reservations = [];
        }
    }

    async render() {
        if (!this.container) return;

        this.container.innerHTML = `<div class="p-6 text-center text-gray-500">กำลังโหลดรายการจองล่วงหน้า...</div>`;
        
        await this.fetchPreorders();

        const html = `
        <div class="p-4 lg:p-6 h-full overflow-y-auto custom-scroll bg-[#F2F2F7]">
            <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-3">
                <div>
                    <h2 class="text-xl font-bold text-gray-900 leading-tight">รายการจองล่วงหน้าจากลูกค้า</h2>
                    <p class="text-xs text-gray-500 mt-1">นำเข้ารายการจองและเมนูที่สั่งล่วงหน้าเข้าตะกร้า POS เพื่อชำระเงิน</p>
                </div>
                <button id="btn-refresh-preorders" class="ios-action-btn ios-btn-secondary px-4 py-2 font-bold text-xs flex items-center justify-center gap-2 shadow-sm">
                    <i class="fas fa-sync-alt"></i> รีเฟรชข้อมูล
                </button>
            </div>
            
            <div class="bg-white p-5 lg:p-6 border border-gray-150 shadow-sm rounded-2xl">
                ${this.reservations.length === 0 
                    ? `<div class="text-center text-gray-400 py-12 text-xs italic">ยังไม่มีรายการจองล่วงหน้าในขณะนี้</div>`
                    : `
                    <div class="space-y-4">
                        ${this.reservations.map(res => {
                            const formattedTime = res.reservation_time 
                                ? Utils.formatDateTime(res.reservation_time, { dateStyle: 'medium', timeStyle: 'short' })
                                : 'ไม่ได้ระบุเวลา';

                            // Parse menu items list from JSONB
                            let items = [];
                            try {
                                items = typeof res.menu_items === 'string' 
                                    ? JSON.parse(res.menu_items) 
                                    : (res.menu_items || []);
                            } catch (e) {
                                items = [];
                            }

                            return `
                            <div class="p-4 bg-white border border-gray-100 rounded-xl hover:border-[#007AFF]/50 transition flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div class="flex-grow min-w-0">
                                    <div class="flex flex-wrap gap-2 items-center mb-1">
                                        <span class="font-bold text-gray-950 text-base truncate">${res.name}</span>
                                        <span class="text-[10px] bg-blue-50 text-[#007AFF] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-blue-100">
                                            <i class="far fa-clock"></i> ${formattedTime}
                                        </span>
                                    </div>
                                    <div class="text-xs text-gray-500 mb-2">เบอร์โทรศัพท์: <a href="tel:${res.phone}" class="text-[#007AFF] font-semibold hover:underline">${res.phone}</a></div>
                                    
                                    <div class="border-t border-dashed border-gray-100 pt-2.5 mt-2.5">
                                        <div class="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">รายการเมนูสั่งล่วงหน้า</div>
                                        <ul class="text-xs text-gray-600 space-y-1">
                                            ${items.map(item => `
                                                <li class="flex items-center gap-2">
                                                    <span class="bg-gray-100 text-gray-700 px-1.5 py-0.2 rounded font-bold text-[9px]">${item.qty}x</span>
                                                    <span class="font-medium text-gray-700">${item.name}</span>
                                                    <span class="text-gray-400">@ ฿${Number(item.price).toLocaleString()}</span>
                                                </li>
                                            `).join('')}
                                        </ul>
                                    </div>
                                </div>
                                <div class="flex flex-col items-end shrink-0 w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0 gap-2">
                                    <div class="text-right">
                                        <div class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">ยอดรวมทั้งหมด</div>
                                        <div class="text-lg font-black text-[#FF9500]">฿${Number(res.total_price).toLocaleString()}</div>
                                    </div>
                                    <button data-action="import-preorder" data-id="${res.id}" class="ios-action-btn ios-btn-primary bg-[#34C759] hover:bg-green-600 text-white font-bold px-4 py-2 text-xs flex items-center justify-center gap-1.5 shadow-sm">
                                        <i class="fas fa-file-import pointer-events-none"></i> <span class="pointer-events-none">ดึงเข้าตะกร้า POS</span>
                                    </button>
                                </div>
                            </div>
                            `;
                        }).join('')}
                    </div>
                    `
                }
            </div>
        </div>
        `;

        this.container.innerHTML = html;

        this.bindEvents();
    }

    bindEvents() {
        // Refresh Button
        const refreshBtn = this.container.querySelector('#btn-refresh-preorders');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.render());
        }

        // Import Buttons
        const importBtns = this.container.querySelectorAll('[data-action="import-preorder"]');
        importBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const resId = e.currentTarget.dataset.id;
                const reservation = this.reservations.find(r => r.id === resId);
                if (reservation && this.onImportCallback) {
                    this.onImportCallback(reservation);
                }
            });
        });
    }
}
