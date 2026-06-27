import { posService } from '../services/POSService.js';
import { adminService } from '../services/AdminService.js';
import { POSView } from '../views/POSView.js';
import { AdminDashboardView } from '../views/AdminDashboardView.js';
import { AdminHistoryView } from '../views/AdminHistoryView.js';
import { AdminMenuView } from '../views/AdminMenuView.js';
import { AdminSettings } from '../pages/adminSettings.js';
import { AdminPreordersView } from '../views/AdminPreordersView.js';
import { Utils } from '../utils.js';
import { supabase } from '../core/SupabaseClient.js';

export class App {
constructor() {
this.currentView = 'pos_orders';

// Auth / State
this.companyId = '00000000-0000-0000-0000-000000000000'; // Default test company
this.branchId = null;

// Initialize Views
this.views = {
pos: new POSView('app-container'),
preorders: new AdminPreordersView('app-container'),
dashboard: new AdminDashboardView('app-container'),
history: new AdminHistoryView('app-container'),
menu: new AdminMenuView('app-container'),
settings: null  // lazy-init AdminSettings on demand
};

this.views.preorders.setOnImport((reservation) => {
this.handleImportPreorder(reservation);
});

// POS View Callbacks
this.views.pos.onSelectOrderCallback = (orderId) => {
this.handleSelectOrder(orderId);
};
this.views.pos.onNewOrderCallback = () => {
this.handleNewOrder();
};
this.views.pos.onParkCallback = async (tableId) => {
await this.handleParkOrder(tableId);
};
this.views.pos.onCheckoutCallback = async (paymentMethod, notes) => {
await this.handleCheckout(paymentMethod, notes);
};

// Admin Menu View Callbacks
this.views.menu.onSaveMenuCallback = async (itemData, editingId) => {
await this.handleSaveMenu(itemData, editingId);
};
this.views.menu.onEditMenuCallback = (id) => {
this.handleEditMenu(id);
};
this.views.menu.onDeleteMenuCallback = async (id) => {
await this.handleDeleteMenu(id);
};
this.views.menu.onCancelEditCallback = () => {
this.handleCancelEditMenu();
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
// Check active login session
const { data: { session }, error: sessionError } = await supabase.auth.getSession();
if (sessionError) throw sessionError;

if (!session) {
this.renderLoginScreen();
document.getElementById('loading-spinner')?.classList.add('hidden');
return;
}

// Bind user display info & logout handlers
const displayEl = document.getElementById('mobile-user-display');
if (displayEl) {
displayEl.innerHTML = `<span class="truncate max-w-[120px] inline-block font-semibold">${session.user.email}</span> <a href="#" id="btn-logout" class="text-red-500 font-bold ml-2 hover:underline">Log Out</a>`;
displayEl.querySelector('#btn-logout')?.addEventListener('click', async (e) => {
e.preventDefault();
if (confirm('คุณต้องการออกจากระบบหรือไม่?')) {
await supabase.auth.signOut();
window.location.reload();
}
});
}

const sysStatusEl = document.getElementById('sys-status');
if (sysStatusEl) {
sysStatusEl.parentElement.innerHTML = `
<div class="mb-2">System: <span class="font-mono font-bold text-green-600">Online (Supabase)</span></div>
<div class="text-gray-600 truncate text-[11px] mb-2 font-medium"><b>User:</b> ${session.user.email}</div>
<button id="btn-sidebar-logout" class="w-full text-center text-xs bg-red-50 text-red-600 py-1.5 rounded-lg font-bold hover:bg-red-100 transition border border-red-200"><i class="fas fa-sign-out-alt mr-1"></i> ออกจากระบบ</button>
`;
document.getElementById('btn-sidebar-logout')?.addEventListener('click', async () => {
if (confirm('คุณต้องการออกจากระบบหรือไม่?')) {
await supabase.auth.signOut();
window.location.reload();
}
});
}

// Restore sidebar display just in case it was hidden by login screen
document.getElementById('sidebar')?.classList.remove('hidden', 'lg:hidden');

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
'pos_preorders': document.getElementById('nav-pos-preorders'),
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
if (viewName === 'pos_orders') {
const pending = await posService.fetchPendingOrders(this.companyId, this.branchId);
this.views.pos.setPendingOrders(pending);
}
this.views.pos.currentView = viewName;
this.views.pos.render();
}
else if (viewName === 'pos_preorders') {
await this.views.preorders.render();
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
const { data: categories, error } = await supabase
.from('categories')
.select('*')
.eq('company_id', this.companyId)
.eq('is_active', true)
.order('sort_order', { ascending: true });

if (error) {
console.error("Error fetching categories:", error);
}

this.views.menu.setCategories(categories || []);
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

async handleCheckout(paymentMethod = 'CASH', notes = '') {
try {
document.getElementById('loading-spinner')?.classList.remove('hidden');
// For now, fake a cashier UUID (In reality, get from auth)
const cashierId = '00000000-0000-0000-0000-000000000000';

const { orderHeader, deletedResId } = await posService.checkout(this.companyId, this.branchId, cashierId, paymentMethod, notes);

if (deletedResId) {
// If it was imported from a reservation, clean it up from Supabase
const { error: deleteError } = await supabase
.from('guest_reservations')
.delete()
.eq('id', deletedResId);
if (deleteError) {
console.error("Error deleting guest reservation:", deleteError);
}
}

this.alert(`ชำระเงินสำเร็จ! ออเดอร์ ${orderHeader.order_no}`);

// Reset UI
this.views.pos.currentTableId = 'ออเดอร์ใหม่';

// Re-render
this.changeView('pos_orders');
} catch (e) {
this.alert(e.message || "การชำระเงินผิดพลาด");
} finally {
document.getElementById('loading-spinner')?.classList.add('hidden');
}
}

async handleParkOrder(tableId) {
try {
document.getElementById('loading-spinner')?.classList.remove('hidden');
const cashierId = '00000000-0000-0000-0000-000000000000';

const order = await posService.saveDraftOrder(this.companyId, this.branchId, tableId, cashierId);
this.alert(`พักบิลสำเร็จ! เลขที่ ${order.order_no}`);

// Re-render
this.views.pos.currentTableId = tableId;
this.changeView('pos_orders');
} catch (e) {
this.alert(e.message || "การพักบิลผิดพลาด");
} finally {
document.getElementById('loading-spinner')?.classList.add('hidden');
}
}

handleSelectOrder(orderId) {
const order = this.views.pos.pendingOrders.find(o => o.id === orderId);
if (!order) return;

posService.clearCart();
posService.activeOrderId = order.id;
posService.discount = { 
type: order.discount_type || 'AMOUNT', 
value: Number(order.discount_value) || 0 
};
posService.taxRate = Number(order.tax_rate) || 7.00;

const items = order.order_items || [];
items.forEach(item => {
const menuItem = this.menuData.find(m => m.id === item.menu_item_id);
if (menuItem) {
posService.addItem(menuItem, item.quantity);
} else {
// Fallback for virtual items
posService.addItem({
id: item.menu_item_id,
name_th: item.item_name_th,
base_price_cents: item.price_per_unit_cents
}, item.quantity);
}
});

this.views.pos.currentTableId = order.table_id || 'ออเดอร์ใหม่';
this.changeView('pos_menu');
}

handleNewOrder() {
posService.clearCart();
this.views.pos.currentTableId = 'ออเดอร์ใหม่';
this.changeView('pos_menu');
}

handleImportPreorder(reservation) {
// 1. Clear cart
posService.clearCart();

// Save reservation ID to clear upon checkout
posService.activeReservationId = reservation.id;

// 2. Parse items
let items = [];
try {
items = typeof reservation.menu_items === 'string' 
? JSON.parse(reservation.menu_items) 
: (reservation.menu_items || []);
} catch (e) {
items = [];
}

// 3. Match items with menuData and add to cart
items.forEach(item => {
const menuItem = this.menuData.find(m => m.id === item.menu_id);
if (menuItem) {
posService.addItem(menuItem, item.qty);
} else {
// Fallback if item id doesn't match exactly (e.g. deleted or ID mismatch)
// Build a virtual menu item
posService.addItem({
id: item.menu_id,
name_th: item.name,
base_price_cents: Utils.bahtToCents(item.price),
}, item.qty);
}
});

// 4. Set current table / customer name
this.views.pos.currentTableId = `จอง: ${reservation.name}`;

// 5. Change view to POS Cashier Menu
const navs = {
'pos_orders': document.getElementById('nav-pos-orders'),
'pos_preorders': document.getElementById('nav-pos-preorders'),
'admin_dashboard': document.getElementById('nav-admin-dashboard'),
'admin_history': document.getElementById('nav-admin-history'),
'admin_menu': document.getElementById('nav-admin-menu'),
'admin_settings': document.getElementById('nav-admin-settings')
};
this.changeView('pos_menu');
this.updateNavActive(navs, 'pos_orders');
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

async handleSaveMenu(itemData, editingId) {
try {
document.getElementById('loading-spinner')?.classList.remove('hidden');

if (editingId) {
// Update
const { error } = await supabase
.from('menu_items')
.update({
name_th: itemData.name_th,
name_en: itemData.name_en,
base_price_cents: itemData.base_price_cents,
category_id: itemData.category_id,
is_sold_out: itemData.is_sold_out,
image_url: itemData.image_url,
updated_at: new Date().toISOString()
})
.eq('id', editingId);

if (error) throw error;
this.alert('แก้ไขเมนูสำเร็จ!');
} else {
// Insert
const sku = `SKU-${Date.now()}`;
const { error } = await supabase
.from('menu_items')
.insert({
company_id: this.companyId,
sku: sku,
name_th: itemData.name_th,
name_en: itemData.name_en,
base_price_cents: itemData.base_price_cents,
category_id: itemData.category_id,
is_sold_out: itemData.is_sold_out,
image_url: itemData.image_url,
is_active: true
});

if (error) throw error;
this.alert('เพิ่มเมนูสำเร็จ!');
}

// Refresh menu cache
this.menuData = await posService.fetchMenu(this.companyId, this.branchId);
this.views.pos.setMenu(this.menuData);

// Re-render admin menu
this.changeView('admin_menu');
} catch (e) {
console.error("Save menu error:", e);
this.alert(e.message || "เกิดข้อผิดพลาดในการบันทึกเมนู");
} finally {
document.getElementById('loading-spinner')?.classList.add('hidden');
}
}

handleEditMenu(id) {
this.views.menu.render(this.menuData, id);
}

async handleDeleteMenu(id) {
try {
document.getElementById('loading-spinner')?.classList.remove('hidden');

const { error } = await supabase
.from('menu_items')
.delete()
.eq('id', id);

if (error) throw error;
this.alert('ลบเมนูสำเร็จ!');

// Refresh menu cache
this.menuData = await posService.fetchMenu(this.companyId, this.branchId);
this.views.pos.setMenu(this.menuData);

// Re-render admin menu
this.changeView('admin_menu');
} catch (e) {
console.error("Delete menu error:", e);
this.alert(e.message || "เกิดข้อผิดพลาดในการลบเมนู");
} finally {
document.getElementById('loading-spinner')?.classList.add('hidden');
}
}

handleCancelEditMenu() {
this.changeView('admin_menu');
}

renderLoginScreen() {
// Hide sidebar and header elements if on login screen
document.getElementById('sidebar')?.classList.add('hidden', 'lg:hidden');

const container = document.getElementById('app-container');
if (!container) return;

container.innerHTML = `
<div class="min-h-full flex items-center justify-center bg-[#F2F2F7] py-12 px-4 sm:px-6 lg:px-8">
<div class="max-w-md w-full bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-xl border border-gray-200/50">
<div>
<div class="mx-auto h-16 w-16 bg-[#007AFF] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-[#007AFF]/25 mb-4">
<i class="fas fa-cash-register text-2xl"></i>
</div>
<h2 class="text-center text-2xl font-black text-gray-900 tracking-tight">
Me <span class="text-[#007AFF]">POS</span>
</h2>
<p class="mt-2 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
ระบบขายหน้าร้านสำหรับผู้ดูแลระบบ
</p>
</div>
<form class="mt-8 space-y-5" id="pos-login-form">
<div class="space-y-4">
<div>
<label for="login-email" class="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">อีเมลผู้ใช้งาน</label>
<input id="login-email" name="email" type="email" required class="appearance-none rounded-2xl relative block w-full px-4 py-3 bg-[#F2F2F7] border border-transparent placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:bg-white sm:text-sm transition duration-200" placeholder="admin@meinlicht.com">
</div>
<div>
<label for="login-password" class="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">รหัสผ่าน</label>
<input id="login-password" name="password" type="password" required class="appearance-none rounded-2xl relative block w-full px-4 py-3 bg-[#F2F2F7] border border-transparent placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:bg-white sm:text-sm transition duration-200" placeholder="••••••••">
</div>
</div>

<div id="login-error-msg" class="text-[#FF3B30] text-xs text-center font-bold hidden bg-[#FF3B30]/10 p-3 rounded-2xl border border-[#FF3B30]/20"></div>

<div class="pt-2">
<button type="submit" class="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-2xl text-white bg-[#007AFF] hover:bg-[#007AFF]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#007AFF] shadow-lg shadow-[#007AFF]/15 transition duration-200 active:scale-[0.98]">
เข้าสู่ระบบ
</button>
</div>
</form>
</div>
</div>
`;

const form = container.querySelector('#pos-login-form');
form.addEventListener('submit', async (e) => {
e.preventDefault();
const email = form.querySelector('#login-email').value.trim();
const password = form.querySelector('#login-password').value;
const errorMsg = container.querySelector('#login-error-msg');

errorMsg.classList.add('hidden');
document.getElementById('loading-spinner')?.classList.remove('hidden');

try {
const { error } = await supabase.auth.signInWithPassword({ email, password });
if (error) throw error;

// Restore sidebar display
document.getElementById('sidebar')?.classList.remove('hidden', 'lg:hidden');
document.getElementById('sidebar')?.classList.add('sidebar', 'fixed', 'inset-y-0', 'left-0', 'lg:relative', 'lg:translate-x-0', 'lg:flex');

// Re-run init
await this.init();
} catch (err) {
console.error("Login failed:", err);
errorMsg.textContent = err.message || "รหัสผ่านไม่ถูกต้อง";
errorMsg.classList.remove('hidden');
} finally {
document.getElementById('loading-spinner')?.classList.add('hidden');
}
});
}
}
