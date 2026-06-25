-- =======================================================
-- UNIFIED SCHEMA & SEED FOR ME POS (ONE-CLICK EXECUTION)
-- =======================================================

-- ล้างโครงสร้างเดิมที่มีอยู่ก่อน (เพื่อให้สามารถกด Run ซ้ำใหม่ได้เรื่อยๆ โดยไม่ติดขัด)
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.menu_items CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.employee_profiles CASCADE;
DROP TABLE IF EXISTS public.roles CASCADE;
DROP TABLE IF EXISTS public.branches CASCADE;
DROP TABLE IF EXISTS public.companies CASCADE;

DROP TYPE IF EXISTS order_status CASCADE;
DROP TYPE IF EXISTS discount_type CASCADE;
DROP TYPE IF EXISTS payment_method CASCADE;

-- 1. สร้าง Enum Types สำหรับจำกัดค่า Status
CREATE TYPE order_status AS ENUM ('PENDING', 'PAID', 'CANCELLED', 'REFUNDED');
CREATE TYPE discount_type AS ENUM ('AMOUNT', 'PERCENTAGE');
CREATE TYPE payment_method AS ENUM ('CASH', 'TRANSFER', 'CREDIT_CARD', 'PROMPT_PAY');

-- ==========================================
-- [SaaS CORE & ORGANIZATION TABLES]
-- ==========================================

-- 1.0 ตารางบริษัท (Companies / Tenants)
CREATE TABLE public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(150) NOT NULL,
    tax_id VARCHAR(50),
    subscription_plan VARCHAR(50) DEFAULT 'FREE',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 1.1 ตารางสาขา (Branches)
CREATE TABLE public.branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    branch_code VARCHAR(20) NOT NULL,
    name_th VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    address TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, branch_code)
);

-- 1.2 ตารางบทบาทสิทธิ์ (Roles)
CREATE TABLE public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    role_name VARCHAR(50) NOT NULL,
    permissions JSONB DEFAULT '{}'::jsonb, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 1.3 ตารางพนักงาน (Employee Profiles)
CREATE TABLE public.employee_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    role_id UUID REFERENCES public.roles(id) ON DELETE RESTRICT,
    primary_branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
    first_name_th VARCHAR(100) NOT NULL,
    last_name_th VARCHAR(100),
    employee_code VARCHAR(20),
    phone_number VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, employee_code)
);

-- ==========================================
-- [CORE POS TABLES]
-- ==========================================

-- 2. ตารางหมวดหมู่สินค้า (Categories)
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
    name_th VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. ตารางเมนูสินค้า (Menu Items)
CREATE TABLE public.menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    sku VARCHAR(50), 
    name_th VARCHAR(150) NOT NULL,
    name_en VARCHAR(150),
    base_price_cents INTEGER NOT NULL CHECK (base_price_cents >= 0),
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, sku)
);

-- 4. ตารางบิลออเดอร์ (Orders - Header)
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE RESTRICT,
    order_no VARCHAR(50) NOT NULL, 
    table_id VARCHAR(50), 
    status order_status DEFAULT 'PENDING'::order_status,
    subtotal_cents INTEGER NOT NULL DEFAULT 0,
    discount_type discount_type,
    discount_value NUMERIC(10,2), 
    discount_amount_cents INTEGER DEFAULT 0,
    tax_rate NUMERIC(5,2) DEFAULT 7.00,
    tax_amount_cents INTEGER DEFAULT 0,
    total_net_cents INTEGER NOT NULL DEFAULT 0,
    payment_method payment_method,
    cashier_id UUID REFERENCES public.employee_profiles(id) ON DELETE SET NULL,
    notes TEXT,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, branch_id, order_no)
);

-- 5. ตารางไอเทมในบิล (Order Items - Line Items)
CREATE TABLE public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE SET NULL,
    item_name_th VARCHAR(150) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price_per_unit_cents INTEGER NOT NULL,
    total_line_cents INTEGER NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- [TRIGGERS & FUNCTIONS]
-- ==========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_categories_modtime
    BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_menu_items_modtime
    BEFORE UPDATE ON menu_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_modtime
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- [ROW LEVEL SECURITY (RLS)]
-- ==========================================

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- นโยบายปกติ (ต้องล็อกอิน)
CREATE POLICY "Allow authenticated full access on categories" ON public.categories FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated full access on menu_items" ON public.menu_items FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated full access on orders" ON public.orders FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated full access on order_items" ON public.order_items FOR ALL USING (auth.role() = 'authenticated');

-- นโยบายสำหรับการพัฒนา/ทดสอบแบบไม่เข้าสู่ระบบ (Anonymous Access)
-- (ติ๊กเปิดใช้งานเพื่อให้แอปเชื่อมต่อได้ทันทีโดยไม่ต้องล็อกอินในตอนนี้)
CREATE POLICY "Allow anon read access on categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Allow anon read access on menu_items" ON public.menu_items FOR SELECT USING (true);
CREATE POLICY "Allow anon write access on orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon write access on order_items" ON public.order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon read access on orders" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Allow anon read access on order_items" ON public.order_items FOR SELECT USING (true);

-- ==========================================
-- [INDEXES FOR PERFORMANCE]
-- ==========================================
CREATE INDEX idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX idx_order_items_menu_item_id ON public.order_items(menu_item_id);

-- ==========================================
-- [SEED MOCK DATA FOR LOCAL TESTING]
-- ==========================================

-- 1. สร้างบริษัททดสอบตัวอย่าง (SaaS Tenant)
INSERT INTO public.companies (id, company_name, tax_id, subscription_plan, is_active)
VALUES ('00000000-0000-0000-0000-000000000000', 'Mein POS (Default Test)', '1234567890123', 'FREE', true)
ON CONFLICT (id) DO NOTHING;

-- 2. สร้างสาขาทดสอบตัวอย่าง
INSERT INTO public.branches (id, company_id, branch_code, name_th, name_en, address, is_active)
VALUES ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'BKK-01', 'สาขาหลัก กรุงเทพ', 'Main Branch Bangkok', '123 Sukhumvit Rd, Bangkok', true)
ON CONFLICT (company_id, branch_code) DO NOTHING;

-- 3. สร้างหมวดหมู่สินค้าตัวอย่าง (Categories)
INSERT INTO public.categories (id, company_id, name_th, name_en, sort_order, is_active)
VALUES 
  ('c1111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'อาหารจานเดียว', 'Single Dishes', 1, true),
  ('c2222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'ทานเล่น', 'Appetizers', 2, true),
  ('c3333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000', 'เครื่องดื่ม', 'Drinks', 3, true)
ON CONFLICT (id) DO NOTHING;

-- 4. สร้างเมนูสินค้าตัวอย่าง (Menu Items)
INSERT INTO public.menu_items (id, company_id, category_id, sku, name_th, name_en, base_price_cents, is_active)
VALUES
  ('e1111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'c1111111-1111-1111-1111-111111111111', 'SKU-001', 'ผัดไทยกุ้งสด', 'Pad Thai with Shrimp', 8500, true),
  ('e2222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'c1111111-1111-1111-1111-111111111111', 'SKU-002', 'ข้าวผัดปู', 'Crab Fried Rice', 9500, true),
  ('e3333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000', 'c1111111-1111-1111-1111-111111111111', 'SKU-003', 'กะเพราหมูสับไข่ดาว', 'Basil Pork with Fried Egg', 7500, true),
  ('e4444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000000', 'c2222222-2222-2222-2222-222222222222', 'SKU-004', 'ปีกไก่ทอดเกลือ', 'Fried Chicken Wings', 12000, true),
  ('e5555555-5555-5555-5555-555555555555', '00000000-0000-0000-0000-000000000000', 'c2222222-2222-2222-2222-222222222222', 'SKU-005', 'ลูกชิ้นปิ้ง', 'Grilled Meatballs', 6000, true),
  ('e6666666-6666-6666-6666-666666666666', '00000000-0000-0000-0000-000000000000', 'c3333333-3333-3333-3333-333333333333', 'SKU-006', 'ชาไทยเย็น', 'Thai Iced Tea', 5000, true),
  ('e7777777-7777-7777-7777-777777777777', '00000000-0000-0000-0000-000000000000', 'c3333333-3333-3333-3333-333333333333', 'SKU-007', 'น้ำมะพร้าวอ่อนปั่น', 'Coconut Smoothie', 6500, true)
ON CONFLICT (id) DO NOTHING;
