import { posService } from '../services/POSService.js';
import { adminService } from '../services/AdminService.js';
import { POSView } from '../views/POSView.js';
import { AdminDashboardView } from '../views/AdminDashboardView.js';
import { AdminHistoryView } from '../views/AdminHistoryView.js';
import { AdminMenuView } from '../views/AdminMenuView.js';
import { AdminSettings } from '../pages/adminSettings.js';
import { Utils } from '../utils.js';

export class App {
    constructor() {
        this.currentView = 'pos_orders';

        // Auth / State
        this.companyId = '00000000-0000-0000-0000-000000000000'; // Default test company
        this.branchId = null;

        // Initialize Views
        this.views = {
            pos: new POSView('app-container'),
            dashboard: new AdminDashboardView('app-container'),
            history: new AdminHistoryView('app-container'),
            menu: new AdminMenuView('app-container'),
            settings: null  // lazy-init AdminSettings on demand
        };

        // Data Cache
        this.menuData = [];
        this.orderHistory = [];

        this.init();
    }

    async init() {
        console.log("App Initialization Started (Supabase Engine)");
        document.getElementById('loading-spinner')?.classList.remove('hidden');

        try {
            // 1. Fetch initial data (Menu)
            this.menuData = await posService.fetchMenu(this.companyId, this.branchId);
            this.views.pos.setMenu(this.menuData);

            // 2. Setup initial listeners / route
            this.bindGlobalEvents();
            this.changeView(this.currentView);

            document.getElementById('loading-spinner')?.classList.add('hidden');
        } catch (error) {
            console.error("Initialization error:", error);

            // Check if it's the default placeholder error
            const isPlaceholder = process.env.SUPABASE_URL && process.env.SUPABASE_URL.includes('your-project');

            if (isPlaceholder || error.message.includes('fetch')) {
                this.alert(`
                    <strong class="text-red-600 text-lg block mb-2"><i class="fas fa-exclamation-triangle"></i> ข้อมูลการเชื่อมต่อฐานข้อมูลไม่ถูกต้อง</strong>
                    คุณยังไม่ได้ตั้งค่า <b>SUPABASE_URL</b> และ <b>SUPABASE_ANON_KEY</b> ในไฟล์ <code>.env</code><br><br>
                    โปรดไปยังไฟล์ <code>.env</code> แล้วใส่ค่าที่ได้จาก Project ของคุณในเว็บ Supabase เพื่อให้ระบบทำงานได้สมบูรณ์ครับ
                 `);
            } else {
                this.alert("เกิดข้อผิดพลาดในการโหลดระบบ: " + error.message);
            }
            document.getElementById('loading-spinner')?.classList.add('hidden');
        }
    }

    bindGlobalEvents() {
        // Top Navigation / Sidebar Navigation Mapping
        const navs = {
            'pos_orders': document.getElementById('nav-pos-orders'),
            'admin_dashboard': document.getElementById('nav-admin-dashboard'),
            'admin_history': document.getElementById('nav-admin-history'),
            'admin_menu': document.getElementById('nav-admin-menu'),
            'admin_settings': document.getElementById('nav-admin-settings')
        };

        Object.keys(navs).forEach(key => {
            if (navs[key]) {
                navs[key].addEventListener('click', () => {
                    this.changeView(key);
                    this.updateNavActive(navs, key);
                });
            }
        });

        // POS Events Delegation
        document.body.addEventListener('click', async (e) => {
            // Checkout handling from POS View
            if (e.target.id === 'btn-checkout') {
                await this.handleCheckout();
            }

            // Parking/Saving Bill
            if (e.target.id === 'btn-park') {
                // UI logic for parsing bills - Needs to move from pos_pending_orders in sessionStorage -> supabase
                this.alert("ระบบพักบิลกำลังถูกพัฒนาใหม่ด้วยฐานข้อมูล Supabase");
            }

            // Sidebar overlay mobile
            if (e.target.id === 'sidebar-overlay') {
                this.toggleSidebar();
            }
        });
    }

    updateNavActive(navs, activeKey) {
        Object.values(navs).forEach(el => el?.classList.remove('active'));

        let targetNav = navs[activeKey];
        if (activeKey === 'pos_menu') targetNav = navs['pos_orders'];

        if (targetNav) targetNav.classList.add('active');
    }

    async changeView(viewName) {
        this.currentView = viewName;
        document.getElementById('loading-spinner')?.classList.remove('hidden');

        try {
            if (viewName === 'pos_orders' || viewName === 'pos_menu') {
                this.views.pos.currentView = viewName;
                this.views.pos.render();
            }
            else if (viewName === 'admin_dashboard') {
                const endDate = Utils.getTodayDateString();
                // Default to last 7 days initially
                const d = new Date();
                d.setDate(d.getDate() - 7);
                const startDate = Utils.getTodayDateString(d);

                const data = await adminService.getSalesDashboard(this.companyId, this.branchId, startDate, endDate);
                this.views.dashboard.render(data);
            }
            else if (viewName === 'admin_history') {
                const { data } = await adminService.getOrderHistory(this.companyId);
                this.views.history.render(data);
            }
            else if (viewName === 'admin_menu') {
                this.views.menu.render(this.menuData);
            }
            else if (viewName === 'admin_settings') {
                const container = document.getElementById('app-container');
                if (!this.views.settings) {
                    this.views.settings = new AdminSettings(container);
                } else {
                    this.views.settings.container = container;
                    await this.views.settings._render();
                }
            }
        } catch (error) {
            console.error(`Error rendering view ${viewName}:`, error);
            this.alert(`Error loading data for ${viewName}`);
        } finally {
            document.getElementById('loading-spinner')?.classList.add('hidden');
        }
    }

    async handleCheckout() {
        try {
            document.getElementById('loading-spinner')?.classList.remove('hidden');
            // For now, fake a cashier UUID (In reality, get from auth)
            const cashierId = '00000000-0000-0000-0000-000000000000';

            const order = await posService.checkout(this.companyId, this.branchId, cashierId, 'CASH');
            this.alert(`ชำระเงินสำเร็จ! ออเดอร์ ${order.order_no}`);

            // Re-render
            this.changeView('pos_orders');
        } catch (e) {
            this.alert(e.message || "การชำระเงินผิดพลาด");
        } finally {
            document.getElementById('loading-spinner')?.classList.add('hidden');
        }
    }

    toggleSidebar() {
        const sb = document.getElementById('sidebar');
        const ov = document.getElementById('sidebar-overlay');
        if (!sb || !ov) return;

        // Basic toggle class
        if (sb.classList.contains('-translate-x-full')) {
            sb.classList.remove('-translate-x-full');
            ov.classList.remove('hidden');
            setTimeout(() => ov.classList.remove('opacity-0'), 10);
        } else {
            sb.classList.add('-translate-x-full');
            ov.classList.add('opacity-0');
            setTimeout(() => ov.classList.add('hidden'), 300);
        }
    }

    alert(msg) {
        const modal = document.getElementById('custom-modal');
        const title = document.getElementById('modal-title');
        const message = document.getElementById('modal-message');
        const btnConfirm = document.getElementById('modal-confirm-btn');
        const btnCancel = document.getElementById('modal-cancel-btn');

        if (!modal) {
            alert(msg); // Fallback
            return;
        }

        title.textContent = 'แจ้งเตือน';
        message.innerHTML = `<div class="p-6 text-center text-gray-700">${msg}</div>`;
        btnCancel.classList.add('hidden');
        btnConfirm.textContent = 'ตกลง';
        btnConfirm.onclick = () => {
            modal.classList.add('hidden');
        };

        modal.classList.remove('hidden');
    }
}
