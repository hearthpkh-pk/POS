-- ==========================================
-- [INDEXES FOR PERFORMANCE]
-- ==========================================
CREATE INDEX idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX idx_order_items_menu_item_id ON public.order_items(menu_item_id);
