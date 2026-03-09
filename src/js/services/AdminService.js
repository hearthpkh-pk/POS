import { supabase } from '../core/SupabaseClient.js';
import { Utils } from '../utils.js';

export class AdminService {

    /**
     * Get total sales summary for a specific company and branch between dates
     */
    static async getSalesDashboard(companyId, branchId, startDate, endDate) {
        // In PostgreSQL, it's best to use an RPC (Remote Procedure Call) for aggregations
        // But for now, we can query the orders table and aggregate here 
        // assuming volume is manageable in the MVP phase.

        try {
            let query = supabase
                .from('orders')
                .select('id, total_net_cents, status, created_at')
                .eq('company_id', companyId)
                .eq('status', 'PAID');

            if (branchId) {
                query = query.eq('branch_id', branchId);
            }

            if (startDate && endDate) {
                query = query.gte('created_at', startDate).lte('created_at', endDate);
            }

            const { data, error } = await query;
            if (error) throw error;

            // Aggregate data
            const totalOrders = data.length;
            const totalRevenueCents = data.reduce((sum, order) => sum + order.total_net_cents, 0);
            const averageOrderCents = totalOrders > 0 ? Math.round(totalRevenueCents / totalOrders) : 0;

            return {
                totalOrders,
                totalRevenueCents,
                averageOrderCents,
                totalRevenueBaht: Utils.centsToBaht(totalRevenueCents),
                averageOrderBaht: Utils.centsToBaht(averageOrderCents)
            };
        } catch (error) {
            console.error("Dashboard Service Error:", error);
            throw error;
        }
    }

    /**
     * Get paginated order history
     */
    static async getOrderHistory(companyId, limit = 50, offset = 0) {
        try {
            const { data, error, count } = await supabase
                .from('orders')
                .select(`
          *,
          employee_profiles (first_name_th),
          order_items (*)
        `, { count: 'exact' })
                .eq('company_id', companyId)
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

            if (error) throw error;

            return { data, count };
        } catch (error) {
            console.error("Order History Error:", error);
            throw error;
        }
    }
}

export const adminService = new AdminService();
