-- ==========================================
-- [ROW LEVEL SECURITY (RLS) - ความปลอดภัยระดับตาราง]
-- ==========================================

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- นโยบายความปลอดภัยเริ่มต้น: อนุญาตให้ User ที่ Authenticated อ่านและเขียนได้ทั้งหมด
CREATE POLICY "Allow authenticated full access on categories" ON public.categories FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated full access on menu_items" ON public.menu_items FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated full access on orders" ON public.orders FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated full access on order_items" ON public.order_items FOR ALL USING (auth.role() = 'authenticated');

-- สำหรับ Local Testing / Development:
-- หากยังไม่มีระบบล็อกอิน (หรือยังไม่ได้ทำ Authentication) ให้สลับมาใช้นโยบายที่อนุญาตให้ "anon" เข้าถึงได้ชั่วคราว
-- โดยลบ/แก้ไขนโยบายด้านบน แล้วเปิดใช้นโยบายแบบนี้แทน:
-- CREATE POLICY "Allow anon access for development on categories" ON public.categories FOR ALL USING (true);
-- CREATE POLICY "Allow anon access for development on menu_items" ON public.menu_items FOR ALL USING (true);
-- CREATE POLICY "Allow anon access for development on orders" ON public.orders FOR ALL USING (true);
-- CREATE POLICY "Allow anon access for development on order_items" ON public.order_items FOR ALL USING (true);
