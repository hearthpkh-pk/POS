-- ==========================================
-- Me POS Database Schema for Supabase (PostgreSQL)
-- Architecture: Enterprise POS Grade + ERP Readiness + SaaS Multi-Tenant
-- ==========================================

-- 1. สร้าง Enum Types สำหรับจำกัดค่า Status
CREATE TYPE order_status AS ENUM ('PENDING', 'PAID', 'CANCELLED', 'REFUNDED');
CREATE TYPE discount_type AS ENUM ('AMOUNT', 'PERCENTAGE');
CREATE TYPE payment_method AS ENUM ('CASH', 'TRANSFER', 'CREDIT_CARD', 'PROMPT_PAY');

-- ==========================================
-- [SaaS CORE & ORGANIZATION TABLES]
-- รองรับ Multi-Tenant (1 Database เก็บรอมข้อมูลได้หลายบริษัท แยกร้านกัน 100%)
-- ==========================================

-- 1.0 ตารางบริษัท (Companies / Tenants) - หัวใจหลักของ SaaS
CREATE TABLE public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(150) NOT NULL,
    tax_id VARCHAR(50), -- เลขนิติบุคคลของลูกค้า (อ่าวไส้ออกใบกำกับ)
    subscription_plan VARCHAR(50) DEFAULT 'FREE', -- เช่น FREE, PRO, ENTERPRISE
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 1.1 ตารางสาขา (Branches) - ลูกค้าร้านเดียวเปิดได้หลายสาขา
CREATE TABLE public.branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE, -- ผูกติดบริษัทเสมอ!
    branch_code VARCHAR(20) NOT NULL, -- เช่น 'BKK-01'
    name_th VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    address TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, branch_code) -- 1 บริษัทห้ามใช้รหัสสาขาซ้ำกัน
);

-- 1.2 ตารางบทบาทสิทธิ์ (Roles) - สามารถมีสิทธิ์กลาง หรือสิทธิ์พรีเมียมเฉพาะบริษัท
CREATE TABLE public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE, -- ถ้า NULL คือสิทธิ์กลางของระบบ SaaS
    role_name VARCHAR(50) NOT NULL,
    permissions JSONB DEFAULT '{}'::jsonb, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 1.3 ตารางพนักงาน (Employee Profiles)
CREATE TABLE public.employee_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, -- อ้างอิง Supabase Auth
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE, -- พนักงานต้องมีสังกัดบริษัท!
    role_id UUID REFERENCES public.roles(id) ON DELETE RESTRICT,
    primary_branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
    
    first_name_th VARCHAR(100) NOT NULL,
    last_name_th VARCHAR(100),
    employee_code VARCHAR(20),
    phone_number VARCHAR(20),
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, employee_code) -- รหัสพนักงานห้ามซ้ำกันภายในบริษัทเดียวกัน
);

-- ==========================================
-- [CORE POS TABLES]
-- ทุกตาราง Transaction ต้องมี company_id ฝังไว้เพื่อความปลอดภัยระดับสูงสุด
-- ==========================================

-- 2. ตารางหมวดหมู่สินค้า (Categories)
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE, -- ทำเมนูแยกเฉพาะสาขาได้
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
    
    -- FINANCIAL: CENTS ONLY
    base_price_cents INTEGER NOT NULL CHECK (base_price_cents >= 0),
    
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, sku) -- SKU ห้ามซ้ำกันภายในบริษัท
);

-- ==========================================
-- [TRANSACTION TABLES]
-- ==========================================

-- 4. ตารางบิลออเดอร์ (Orders - Header)
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE RESTRICT,
    
    -- เช่น 'INV-BKK01-0001'
    order_no VARCHAR(50) NOT NULL, 
    table_id VARCHAR(50), 
    status order_status DEFAULT 'PENDING'::order_status,
    
    -- FINANCIAL (CENTS):
    subtotal_cents INTEGER NOT NULL DEFAULT 0,
    discount_type discount_type,
    discount_value NUMERIC(10,2), 
    discount_amount_cents INTEGER DEFAULT 0,
    tax_rate NUMERIC(5,2) DEFAULT 7.00,
    tax_amount_cents INTEGER DEFAULT 0,
    total_net_cents INTEGER NOT NULL DEFAULT 0,
    
    -- Payment & Audit
    payment_method payment_method,
    cashier_id UUID REFERENCES public.employee_profiles(id) ON DELETE SET NULL,
    notes TEXT,
    paid_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, branch_id, order_no) -- เลขบิลห้ามซ้ำกันในสาขาและบริษัทเดียวกัน
);

-- 5. ตารางไอเทมในบิล (Order Items - Line Items)
-- ตารางนี้สำคัญมาก: ต้องดึง "ราคาสินค้า ณ วินาทีที่ขาย" มาเก็บไว้ที่นี่เสมอ 
-- ห้าม Join ไปอ้างอิงราคาจาก menu_items ตอนออกรีพอร์ต (ไม่งั้นถ้าราคาเมนูอัปเดต รีพอร์ตเก่าพังหมด)
CREATE TABLE public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE SET NULL, -- เผื่อลบเมนูทิ้งไปแล้ว
    
    -- Snapshot ข้อมูล ณ ตอนขายให้เป็น Immutable:
    item_name_th VARCHAR(150) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price_per_unit_cents INTEGER NOT NULL,
    total_line_cents INTEGER NOT NULL,
    
    notes TEXT, -- หมายเหตุ (เช่น เผ็ดน้อย, ไม่ผัก)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- [TRIGGERS & FUNCTIONS]
-- ==========================================

-- 6. Function อัปเดต updated_at อัตโนมัติเวลาแก้ไขแถว
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
-- [ROW LEVEL SECURITY (RLS) - ความปลอดภัยระดับตาราง]
-- ==========================================
-- (สมมติว่าทุกคนที่ล็อกอินเข้ามาคือพนักงาน - ปรับแต่งได้ตามความต้องการ)

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- อนุญาตให้ User ที่ Authenticated อ่านและเขียนได้ทั้งหมด
-- ถ้าในอนาคตมี Role ยิบย่อย (Admin, Cashier) ให้มาตั้งเงื่อนไข Using เพิ่มที่นี่
CREATE POLICY "Allow authenticated full access on categories" ON public.categories FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated full access on menu_items" ON public.menu_items FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated full access on orders" ON public.orders FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated full access on order_items" ON public.order_items FOR ALL USING (auth.role() = 'authenticated');

-- ==========================================
-- [INDEXES FOR PERFORMANCE]
-- เตรียมสเกล: สร้างดัชนีเพื่อช่วยดึง Dashboard Report รวดเร็ว
-- ==========================================
CREATE INDEX idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX idx_order_items_menu_item_id ON public.order_items(menu_item_id);
