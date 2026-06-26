-- Migration: Add store logo setting
-- Filename: 00015_add_store_logo.sql

INSERT INTO public.restaurant_settings (key, label, setting_type, value) VALUES
  ('store_logo', 'โลโก้ร้านค้า', 'image', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=120&h=120&fit=crop')
ON CONFLICT (key) DO NOTHING;
