-- Migration: Add settings for store contact, location maps, and opening hours
-- Filename: 00011_add_dock_settings.sql

INSERT INTO public.restaurant_settings (key, label, setting_type, value) VALUES
  ('store_phone', 'เบอร์โทรศัพท์ติดต่อร้าน', 'text', '081-234-5678'),
  ('location_url', 'ลิงก์ Google Maps ของร้าน', 'text', 'https://maps.google.com'),
  ('opening_hours', 'เวลาเปิด-ปิดร้าน (เช่น ทุกวัน 11:00 - 22:00)', 'text', 'ทุกวัน 11:00 - 22:00')
ON CONFLICT (key) DO NOTHING;
