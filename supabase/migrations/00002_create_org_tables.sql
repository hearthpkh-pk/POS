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
