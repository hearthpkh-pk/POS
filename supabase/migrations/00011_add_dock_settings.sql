-- Migration: Add settings for store contact, location maps, and opening hours
-- Filename: 00011_add_dock_settings.sql

INSERT INTO public.restaurant_settings (key, label, setting_type, value) VALUES
  ('store_phone', 'เบอร์โทรศัพท์ติดต่อร้าน', 'text', '064-9288187'),
  ('location_url', 'ลิงก์ Google Maps ของร้าน', 'text', 'https://maps.app.goo.gl/qctSRFkG37zZDRdq9'),
  ('opening_hours', 'เวลาเปิด-ปิดร้าน (เช่น ทุกวัน 11:00 - 22:00)', 'text', '11:00 - 19:00 ปิดทุกวันอังคาร แนะนำให้โทรจองก่อนทุกครั้ง'),
  ('storefront_image', 'รูปภาพหน้าร้าน (แสดงท้ายเว็บไซต์)', 'image', 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
