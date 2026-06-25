-- Migration: Add guest_reservations table and menu_items likes
-- Filename: 00012_add_likes_and_reservations.sql

-- 1. Create guest_reservations table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.guest_reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(50) NOT NULL,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150),
    menu_items JSONB NOT NULL,
    total_price NUMERIC(12,2) NOT NULL,
    user_agent TEXT,
    behavior_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Add likes_count column to menu_items table
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;

-- 3. Create function to adjust likes securely (Security Definer to bypass RLS)
CREATE OR REPLACE FUNCTION public.adjust_menu_item_likes(item_id UUID, increment_val INT)
RETURNS VOID AS $$
BEGIN
    UPDATE public.menu_items
    SET likes_count = COALESCE(likes_count, 0) + increment_val
    WHERE id = item_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.guest_reservations ENABLE ROW LEVEL SECURITY;

-- 5. Set up RLS policies for guest_reservations
CREATE POLICY "Allow anon insert on guest_reservations" 
ON public.guest_reservations FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow authenticated read on guest_reservations" 
ON public.guest_reservations FOR SELECT 
USING (auth.role() = 'authenticated');
