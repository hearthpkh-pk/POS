-- Migration: Add POS feature tables
-- Filename: 00005_add_pos_features.sql

-- Menus table
CREATE TABLE IF NOT EXISTS public.menus (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  price numeric(12,2) NOT NULL, -- use numeric for currency, no floating point
  image_url text,
  created_at timestamp with time zone DEFAULT now()
);

-- Menu recommendations (popularity count)
CREATE TABLE IF NOT EXISTS public.menu_recommendations (
  menu_id uuid REFERENCES public.menus(id) ON DELETE CASCADE,
  orders_count int DEFAULT 0,
  PRIMARY KEY (menu_id)
);

-- Reservations table
CREATE TABLE IF NOT EXISTS public.reservations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reservation_time timestamp with time zone NOT NULL,
  party_size int NOT NULL,
  status text DEFAULT 'pending',
  created_at timestamp with time zone DEFAULT now()
);

-- Pinned menus (favorites)
CREATE TABLE IF NOT EXISTS public.pinned_menus (
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  menu_id uuid REFERENCES public.menus(id) ON DELETE CASCADE,
  pinned_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (user_id, menu_id)
);

-- Pre‑orders table
CREATE TABLE IF NOT EXISTS public.preorders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reservation_id uuid REFERENCES public.reservations(id) ON DELETE SET NULL,
  menu_id uuid REFERENCES public.menus(id) ON DELETE SET NULL,
  quantity int NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pinned_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preorders ENABLE ROW LEVEL SECURITY;

-- RLS policies for customers (role = 'customer')
CREATE POLICY "customers_select_menus" ON public.menus FOR SELECT USING (true);
CREATE POLICY "customers_select_recommendations" ON public.menu_recommendations FOR SELECT USING (true);
CREATE POLICY "customers_select_reservations" ON public.reservations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "customers_insert_reservations" ON public.reservations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "customers_update_reservations" ON public.reservations FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "customers_delete_reservations" ON public.reservations FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "customers_select_pinned" ON public.pinned_menus FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "customers_insert_pinned" ON public.pinned_menus FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "customers_delete_pinned" ON public.pinned_menus FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "customers_select_preorders" ON public.preorders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "customers_insert_preorders" ON public.preorders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "customers_update_preorders" ON public.preorders FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "customers_delete_preorders" ON public.preorders FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for employees (role = 'employee')
CREATE POLICY "employees_all" ON public.menus FOR ALL USING (auth.jwt()->>'role' = 'employee');
CREATE POLICY "employees_all_recommendations" ON public.menu_recommendations FOR ALL USING (auth.jwt()->>'role' = 'employee');
CREATE POLICY "employees_all_reservations" ON public.reservations FOR ALL USING (auth.jwt()->>'role' = 'employee');
CREATE POLICY "employees_all_pinned" ON public.pinned_menus FOR ALL USING (auth.jwt()->>'role' = 'employee');
CREATE POLICY "employees_all_preorders" ON public.preorders FOR ALL USING (auth.jwt()->>'role' = 'employee');

-- End of migration
