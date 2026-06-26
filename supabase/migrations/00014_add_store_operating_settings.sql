-- Migration: Add store operating status and hours settings
-- Filename: 00014_add_store_operating_settings.sql

INSERT INTO public.restaurant_settings (key, label, setting_type, value) VALUES
  ('store_status', 'สถานะเปิดบริการหน้าร้าน (open = เปิดปกติ, closed = ปิดบริการชั่วคราว)', 'text', 'open'),
  ('weekly_closed_day', 'วันหยุดประจำสัปดาห์ (ระบุหมายเลข 0=อาทิตย์, 1=จันทร์, 2=อังคาร, 3=พุธ, 4=พฤหัสฯ, 5=ศุกร์, 6=เสาร์)', 'text', '2'),
  ('open_time', 'เวลาเปิดร้าน (เช่น 11:00)', 'text', '11:00'),
  ('close_time', 'เวลาปิดร้าน (เช่น 19:00)', 'text', '19:00')
ON CONFLICT (key) DO NOTHING;
