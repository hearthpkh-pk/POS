// src/js/services/api.js
import { supabase } from '../core/SupabaseClient.js';

/** Fetch all menus */
export async function fetchMenus() {
  const { data, error } = await supabase.from('menus').select('*');
  if (error) throw error;
  return data;
}

/** Fetch recommended menus (ordered by orders_count desc) */
export async function fetchRecommendations(limit = 5) {
  const { data, error } = await supabase
    .from('menu_recommendations')
    .select('menu_id, orders_count, menus(*)')
    .order('orders_count', { ascending: false })
    .limit(limit);
  if (error) throw error;
  // data includes menus object
  return data.map(item => item.menus);
}

/** Create a reservation */
export async function createReservation({ userId, reservation_time, party_size }) {
  const { data, error } = await supabase.from('reservations').insert([
    { user_id: userId, reservation_time, party_size }
  ]).single();
  if (error) throw error;
  return data;
}

/** Fetch pinned menus for a user */
export async function fetchPinnedMenus(userId) {
  const { data, error } = await supabase
    .from('pinned_menus')
    .select('menu_id, menus(*)')
    .eq('user_id', userId);
  if (error) throw error;
  return data.map(item => item.menus);
}

/** Toggle pin (add if not exists, remove if exists) */
export async function togglePin({ userId, menuId }) {
  // Check if already pinned
  const { data: existing, error: errCheck } = await supabase
    .from('pinned_menus')
    .select('*')
    .eq('user_id', userId)
    .eq('menu_id', menuId);
  if (errCheck) throw errCheck;
  if (existing && existing.length > 0) {
    // Unpin
    const { error } = await supabase
      .from('pinned_menus')
      .delete()
      .eq('user_id', userId)
      .eq('menu_id', menuId);
    if (error) throw error;
    return false; // now unpinned
  } else {
    // Pin
    const { error } = await supabase
      .from('pinned_menus')
      .insert([{ user_id: userId, menu_id: menuId }]);
    if (error) throw error;
    return true; // now pinned
  }
}

/** Admin: fetch all orders (placeholder) */
export async function fetchOrderHistory() {
  // Assuming there is an 'orders' table (not defined yet). Return empty array for now.
  const { data, error } = await supabase.from('orders').select('*');
  if (error) return [];
  return data;
}

/** Admin: fetch sales dashboard data (placeholder) */
export async function fetchSalesDashboard({ startDate, endDate }) {
  // Placeholder: returns total orders count and revenue sum.
  const { data, error } = await supabase.rpc('sales_summary', { start_date: startDate, end_date: endDate });
  if (error) return { totalOrders: 0, totalRevenue: 0 };
  return data;
}

/** Admin: CRUD for menus */
export async function createMenu(menu) {
  const { data, error } = await supabase.from('menus').insert([menu]).single();
  if (error) throw error;
  return data;
}
export async function updateMenu(id, updates) {
  const { data, error } = await supabase.from('menus').update(updates).eq('id', id).single();
  if (error) throw error;
  return data;
}
export async function deleteMenu(id) {
  const { error } = await supabase.from('menus').delete().eq('id', id);
  if (error) throw error;
  return true;
}
