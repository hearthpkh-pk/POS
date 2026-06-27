import { supabase } from '../core/SupabaseClient.js';
import { Utils } from '../utils.js';
import { CONSTANTS } from '../config/constants.js';

export class POSService {
    constructor() {
        // Current active order state
        this.cart = []; // Array of items
        this.discount = { type: 'AMOUNT', value: 0 }; // type can be 'AMOUNT' or 'PERCENTAGE'
        this.taxRate = CONSTANTS.TAX_RATE; // Using CONSTANTS, e.g., 7.00
        this.activeOrderId = null;
        this.activeReservationId = null;
    }

    // --- Cart Management ---

    addItem(menuItem, quantity = 1) {
        const existingIndex = this.cart.findIndex(item => item.id === menuItem.id);
        if (existingIndex >= 0) {
            this.cart[existingIndex].quantity += quantity;
        } else {
            this.cart.push({ ...menuItem, quantity });
        }
    }

    removeItem(menuItemId) {
        this.cart = this.cart.filter(item => item.id !== menuItemId);
    }

    updateQuantity(menuItemId, quantity) {
        const item = this.cart.find(item => item.id === menuItemId);
        if (item) {
            item.quantity = quantity;
            if (item.quantity <= 0) {
                this.removeItem(menuItemId);
            }
        }
    }

    clearCart() {
        this.cart = [];
        this.discount = { type: 'AMOUNT', value: 0 };
        this.activeOrderId = null;
        this.activeReservationId = null;
    }

    applyDiscount(type, value) {
        this.discount = { type, value };
    }

    // --- Financial Calculations (Integer Cents) ---

    calculateSubtotalCents() {
        return this.cart.reduce((sum, item) => {
            return sum + (item.base_price_cents * item.quantity);
        }, 0);
    }

    calculateDiscountAmountCents(subtotalCents) {
        if (this.discount.value <= 0) return 0;

        let discountAmountCents = 0;
        if (this.discount.type === 'PERCENTAGE') {
            // e.g. 15% discount
            discountAmountCents = Math.round((subtotalCents * this.discount.value) / 100);
        } else if (this.discount.type === 'AMOUNT') {
            // if discount value is in Baht, we must convert to cents first: Use Utils.bahtToCents
            discountAmountCents = Utils.bahtToCents(this.discount.value);
        }

        // Discount cannot exceed subtotal
        return Math.min(discountAmountCents, subtotalCents);
    }

    calculateTotals() {
        const subtotalCents = this.calculateSubtotalCents();
        const discountAmountCents = this.calculateDiscountAmountCents(subtotalCents);

        // Net before tax if price excludes tax, but let's assume totalNet = subtotal - discount
        const totalNetCents = subtotalCents - discountAmountCents;

        // Calculate VAT (assuming VAT is included in the price for restaurants usually, 
        // but the schema says tax_rate = 7.00. We'll do a simple VAT extraction if included 
        // or addition if excluded based on typical Thai POS. Let's assume VAT is INCLUDED in the net)
        // VAT Amount = TotalNet * (VAT Rate / (100 + VAT Rate))
        const taxAmountCents = Math.round(totalNetCents * (this.taxRate / (100 + this.taxRate)));

        return {
            subtotalCents,
            discountType: this.discount.type,
            discountValue: this.discount.value,
            discountAmountCents,
            taxRate: this.taxRate,
            taxAmountCents,
            totalNetCents,
        };
    }

    // --- Checkout Operations (Supabase) ---

    async checkout(companyId, branchId, cashierId, paymentMethod = 'CASH', notes = '') {
        if (this.cart.length === 0) {
            throw new Error("Cart is empty");
        }

        const totals = this.calculateTotals();

        // Generate a temporary unique order number
        const orderNo = `INV-${Date.now()}`;

        try {
            let orderHeader;
            if (this.activeOrderId) {
                // Update existing PENDING order header to PAID
                const { data, error: orderError } = await supabase
                    .from('orders')
                    .update({
                        status: 'PAID',
                        subtotal_cents: totals.subtotalCents,
                        discount_type: totals.discountType,
                        discount_value: totals.discountValue,
                        discount_amount_cents: totals.discountAmountCents,
                        tax_rate: totals.taxRate,
                        tax_amount_cents: totals.taxAmountCents,
                        total_net_cents: totals.totalNetCents,
                        payment_method: paymentMethod,
                        cashier_id: cashierId,
                        notes: notes,
                        paid_at: new Date().toISOString()
                    })
                    .eq('id', this.activeOrderId)
                    .select()
                    .single();

                if (orderError) throw orderError;
                orderHeader = data;

                // Delete old items
                const { error: deleteError } = await supabase
                    .from('order_items')
                    .delete()
                    .eq('order_id', orderHeader.id);
                
                if (deleteError) throw deleteError;
            } else {
                // Insert new order header
                const { data, error: orderError } = await supabase
                    .from('orders')
                    .insert({
                        company_id: companyId,
                        branch_id: branchId,
                        order_no: orderNo,
                        status: 'PAID',
                        subtotal_cents: totals.subtotalCents,
                        discount_type: totals.discountType,
                        discount_value: totals.discountValue,
                        discount_amount_cents: totals.discountAmountCents,
                        tax_rate: totals.taxRate,
                        tax_amount_cents: totals.taxAmountCents,
                        total_net_cents: totals.totalNetCents,
                        payment_method: paymentMethod,
                        cashier_id: cashierId,
                        notes: notes,
                        paid_at: new Date().toISOString()
                    })
                    .select()
                    .single();

                if (orderError) throw orderError;
                orderHeader = data;
            }

            // Insert new order items
            const orderItems = this.cart.map(item => {
                const cleanId = item.id.split('-').slice(0, 5).join('-');
                return {
                    order_id: orderHeader.id,
                    menu_item_id: cleanId,
                    item_name_th: item.name_th,
                    price_per_unit_cents: item.base_price_cents,
                    quantity: item.quantity,
                    total_line_cents: item.base_price_cents * item.quantity
                };
            });

            const { error: itemsError } = await supabase
                .from('order_items')
                .insert(orderItems);

            if (itemsError) throw itemsError;

            const deletedResId = this.activeReservationId;

            // Clear cart after successful checkout
            this.clearCart();

            return { orderHeader, deletedResId };
        } catch (error) {
            console.error("Checkout failed:", error);
            throw error;
        }
    }

    // --- Draft Order (Parking) Operations ---

    async saveDraftOrder(companyId, branchId, tableId, cashierId, notes = '') {
        if (this.cart.length === 0) {
            throw new Error("Cart is empty");
        }

        const totals = this.calculateTotals();
        const orderNo = `INV-DRAFT-${Date.now()}`;

        try {
            let orderHeader;
            if (this.activeOrderId) {
                // Update existing draft order
                const { data, error: orderError } = await supabase
                    .from('orders')
                    .update({
                        table_id: tableId,
                        subtotal_cents: totals.subtotalCents,
                        discount_type: totals.discountType,
                        discount_value: totals.discountValue,
                        discount_amount_cents: totals.discountAmountCents,
                        tax_rate: totals.taxRate,
                        tax_amount_cents: totals.taxAmountCents,
                        total_net_cents: totals.totalNetCents,
                        cashier_id: cashierId,
                        notes: notes,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', this.activeOrderId)
                    .select()
                    .single();

                if (orderError) throw orderError;
                orderHeader = data;

                // Delete old items
                const { error: deleteError } = await supabase
                    .from('order_items')
                    .delete()
                    .eq('order_id', orderHeader.id);
                
                if (deleteError) throw deleteError;
            } else {
                // Insert new draft order (status = PENDING)
                const { data, error: orderError } = await supabase
                    .from('orders')
                    .insert({
                        company_id: companyId,
                        branch_id: branchId,
                        order_no: orderNo,
                        table_id: tableId,
                        status: 'PENDING',
                        subtotal_cents: totals.subtotalCents,
                        discount_type: totals.discountType,
                        discount_value: totals.discountValue,
                        discount_amount_cents: totals.discountAmountCents,
                        tax_rate: totals.taxRate,
                        tax_amount_cents: totals.taxAmountCents,
                        total_net_cents: totals.totalNetCents,
                        cashier_id: cashierId,
                        notes: notes
                    })
                    .select()
                    .single();

                if (orderError) throw orderError;
                orderHeader = data;
            }

            // Insert new order items
            const orderItems = this.cart.map(item => {
                const cleanId = item.id.split('-').slice(0, 5).join('-');
                return {
                    order_id: orderHeader.id,
                    menu_item_id: cleanId,
                    item_name_th: item.name_th,
                    price_per_unit_cents: item.base_price_cents,
                    quantity: item.quantity,
                    total_line_cents: item.base_price_cents * item.quantity
                };
            });

            const { error: itemsError } = await supabase
                .from('order_items')
                .insert(orderItems);

            if (itemsError) throw itemsError;

            // Set active draft order ID
            this.activeOrderId = orderHeader.id;

            return orderHeader;
        } catch (error) {
            console.error("Save draft failed:", error);
            throw error;
        }
    }

    async fetchPendingOrders(companyId, branchId) {
        const { data, error } = await supabase
            .from('orders')
            .select('*, order_items(*)')
            .eq('company_id', companyId)
            .eq('status', 'PENDING')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    }

    async cancelPendingOrder(orderId) {
        const { error } = await supabase
            .from('orders')
            .delete()
            .eq('id', orderId);

        if (error) throw error;
    }

    // --- Fetching Data ---

    async fetchMenu(companyId, branchId) {
        const { data, error } = await supabase
            .from('menu_items')
            .select('*, categories(id, name_th, name_en, sort_order)')
            .eq('company_id', companyId)
            .eq('is_active', true)
            .order('sort_order', { ascending: true });

        if (error) throw error;
        return data;
    }

    /**
     * Update category ordering based on an array of category IDs in the desired order.
     * Persists the new sort_order (1‑based) to Supabase.
     */
    async updateCategoryOrder(orderArray) {
        if (!Array.isArray(orderArray)) {
            throw new Error('orderArray must be an array of category IDs');
        }
        const updates = orderArray.map((id, idx) =>
            supabase.from('categories').update({ sort_order: idx + 1 }).eq('id', id)
        );
        await Promise.all(updates);
    }

    /**
     * Update menu items ordering and category assignments.
     * @param {Array<{id: string, sort_order: number, category_id: string}>} updatesArray 
     */
    async updateMenuItemOrder(updatesArray) {
        if (!Array.isArray(updatesArray)) {
            throw new Error('updatesArray must be an array of updates');
        }
        const updates = updatesArray.map(item =>
            supabase.from('menu_items')
                .update({ 
                    sort_order: item.sort_order,
                    category_id: item.category_id 
                })
                .eq('id', item.id)
        );
        await Promise.all(updates);
    }
}

// Export as a singleton for the app wide usage
export const posService = new POSService();
