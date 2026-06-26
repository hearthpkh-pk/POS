-- Migration: Cleanup duplicate menus table and consolidate references to menu_items
-- Filename: 00013_cleanup_duplicate_menus.sql

-- 1. Drop old tables referencing public.menus
DROP TABLE IF EXISTS public.preorders CASCADE;
DROP TABLE IF EXISTS public.pinned_menus CASCADE;
DROP TABLE IF EXISTS public.menu_recommendations CASCADE;

-- 2. Drop legacy menus table
DROP TABLE IF EXISTS public.menus CASCADE;

-- 3. Re-create tables referencing public.menu_items
-- Menu recommendations (popularity count)
CREATE TABLE public.menu_recommendations (
  menu_id UUID REFERENCES public.menu_items(id) ON DELETE CASCADE,
  orders_count INT DEFAULT 0,
  PRIMARY KEY (menu_id)
);

-- Pinned menus (favorites)
CREATE TABLE public.pinned_menus (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  menu_id UUID REFERENCES public.menu_items(id) ON DELETE CASCADE,
  pinned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, menu_id)
);

-- Pre‑orders table
CREATE TABLE public.preorders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reservation_id UUID REFERENCES public.guest_reservations(id) ON DELETE SET NULL,
  menu_id UUID REFERENCES public.menu_items(id) ON DELETE SET NULL,
  quantity INT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.menu_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pinned_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preorders ENABLE ROW LEVEL SECURITY;

-- 5. Set up RLS policies (aligning with auth role check)
CREATE POLICY "customers_select_recommendations" ON public.menu_recommendations FOR SELECT USING (true);
CREATE POLICY "customers_select_pinned" ON public.pinned_menus FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "customers_insert_pinned" ON public.pinned_menus FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "customers_delete_pinned" ON public.pinned_menus FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "customers_select_preorders" ON public.preorders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "customers_insert_preorders" ON public.preorders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "customers_update_preorders" ON public.preorders FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "customers_delete_preorders" ON public.preorders FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "employees_all_recommendations" ON public.menu_recommendations FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "employees_all_pinned" ON public.pinned_menus FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "employees_all_preorders" ON public.preorders FOR ALL USING (auth.role() = 'authenticated');

-- 6. Add reservation_time to guest_reservations and is_sold_out to menu_items
ALTER TABLE public.guest_reservations ADD COLUMN IF NOT EXISTS reservation_time TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS is_sold_out BOOLEAN DEFAULT FALSE;
