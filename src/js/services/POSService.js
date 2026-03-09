import { supabase } from '../core/SupabaseClient.js';
import { Utils } from '../utils.js';
import { CONSTANTS } from '../config/constants.js';

export class POSService {
    constructor() {
        // Current active order state
        this.cart = []; // Array of items
        this.discount = { type: 'AMOUNT', value: 0 }; // type can be 'AMOUNT' or 'PERCENTAGE'
        this.taxRate = CONSTANTS.TAX_RATE; // Using CONSTANTS, e.g., 7.00
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

        // Generate a temporary unique order number (In production, use a DB sequence)
        const orderNo = `INV-${Date.now()}`;

        try {
            // 1. Insert Order Header
            const { data: orderHeader, error: orderError } = await supabase
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

            // 2. Prepare Order Items (Snapshot the prices!)
            const orderItems = this.cart.map(item => ({
                order_id: orderHeader.id,
                menu_item_id: item.id,
                item_name_th: item.name_th,
                price_per_unit_cents: item.base_price_cents,
                quantity: item.quantity,
                subtotal_cents: item.base_price_cents * item.quantity
            }));

            // 3. Insert Order Items
            const { error: itemsError } = await supabase
                .from('order_items')
                .insert(orderItems);

            if (itemsError) throw itemsError;

            // 4. Clear cart after successful checkout
            this.clearCart();

            return orderHeader;
        } catch (error) {
            console.error("Checkout failed:", error);
            throw error;
        }
    }

    // --- Fetching Data ---

    async fetchMenu(companyId, branchId) {
        const { data, error } = await supabase
            .from('menu_items')
            .select('*, categories(name_th)')
            .eq('company_id', companyId)
            .eq('is_active', true);

        if (error) throw error;
        return data;
    }
}

// Export as a singleton for the app wide usage
export const posService = new POSService();
