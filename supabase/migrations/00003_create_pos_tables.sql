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
