-- Migration: Create modifiers and members tables
-- Filename: 00018_create_modifiers_and_members.sql

-- 1. Create modifier_groups table
CREATE TABLE IF NOT EXISTS public.modifier_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name_th VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    min_selection INTEGER DEFAULT 0,
    max_selection INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create modifier_options table
CREATE TABLE IF NOT EXISTS public.modifier_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    modifier_group_id UUID NOT NULL REFERENCES public.modifier_groups(id) ON DELETE CASCADE,
    name_th VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    price_cents INTEGER DEFAULT 0 CHECK (price_cents >= 0),
    is_sold_out BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create menu_item_modifier_groups table
CREATE TABLE IF NOT EXISTS public.menu_item_modifier_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    menu_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
    modifier_group_id UUID NOT NULL REFERENCES public.modifier_groups(id) ON DELETE CASCADE,
    sort_order INTEGER DEFAULT 0,
    UNIQUE(menu_item_id, modifier_group_id)
);

-- 4. Create members table
CREATE TABLE IF NOT EXISTS public.members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    phone VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    points INTEGER DEFAULT 0 CHECK (points >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, phone)
);

-- 5. Add ordered_modifiers JSONB column to order_items
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS ordered_modifiers JSONB DEFAULT NULL;

-- 6. Enable Row Level Security (RLS)
ALTER TABLE public.modifier_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modifier_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_item_modifier_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

-- 7. Define RLS Policies
-- Modifiers: Read by anyone, Write by authenticated users only
CREATE POLICY "Allow public read on modifier_groups" ON public.modifier_groups FOR SELECT USING (true);
CREATE POLICY "Allow auth write on modifier_groups" ON public.modifier_groups FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow public read on modifier_options" ON public.modifier_options FOR SELECT USING (true);
CREATE POLICY "Allow auth write on modifier_options" ON public.modifier_options FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow public read on menu_item_modifier_groups" ON public.menu_item_modifier_groups FOR SELECT USING (true);
CREATE POLICY "Allow auth write on menu_item_modifier_groups" ON public.menu_item_modifier_groups FOR ALL USING (auth.role() = 'authenticated');

-- Members: Read/Insert by public (for client search/register), Update/Delete by auth or specific secure functions
CREATE POLICY "Allow public select on members" ON public.members FOR SELECT USING (true);
CREATE POLICY "Allow public insert on members" ON public.members FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow auth write on members" ON public.members FOR ALL USING (auth.role() = 'authenticated');

-- 8. Create Secure Function definition to adjust member points (Security Definer)
CREATE OR REPLACE FUNCTION public.adjust_member_points(company_uuid UUID, member_phone VARCHAR, points_delta INT)
RETURNS INT AS $$
DECLARE
    new_points INT;
BEGIN
    UPDATE public.members
    SET points = COALESCE(points, 0) + points_delta,
        updated_at = CURRENT_TIMESTAMP
    WHERE company_id = company_uuid AND phone = member_phone
    RETURNING points INTO new_points;
    
    RETURN new_points;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
