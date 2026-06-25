-- Migration: Restaurant Settings Table
-- Used for staff to manage customer portal images, text, and branding

CREATE TABLE IF NOT EXISTS public.restaurant_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) NOT NULL UNIQUE,
  value TEXT,
  label VARCHAR(150),
  setting_type VARCHAR(50) DEFAULT 'text', -- 'text' | 'image' | 'color'
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- RLS
ALTER TABLE public.restaurant_settings ENABLE ROW LEVEL SECURITY;

-- Public can READ all settings
CREATE POLICY "public_read_settings"
  ON public.restaurant_settings FOR SELECT
  USING (true);

-- Only authenticated staff can UPDATE/INSERT
CREATE POLICY "staff_write_settings"
  ON public.restaurant_settings FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Seed default values
INSERT INTO public.restaurant_settings (key, label, setting_type, value) VALUES
  -- Branding
  ('store_name',    'ชื่อร้าน',           'text',  'Mein Licht'),
  ('tagline',       'แท็กไลน์',           'text',  'MEXICAN FUSION'),
  ('established',   'ปีที่ก่อตั้ง',        'text',  'ESTD 2024'),
  ('location',      'สาขา',               'text',  'Bangkok, Thailand'),
  -- Hero Section
  ('hero_image',    'รูปหน้าปก (Hero)',   'image', 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=1600&q=80'),
  ('hero_logo',     'โลโก้/มาสคอต',      'image', 'https://images.unsplash.com/photo-1607013251379-e6eecfffe234?w=400&q=80'),
  -- About Section
  ('about_1_title', 'About: หัวข้อ 1',    'text',  'MEIN LICHT'),
  ('about_1_desc',  'About: คำบรรยาย 1',  'text',  'ผสานรสชาติอาหารเม็กซิกันแท้กับความคิดสร้างสรรค์แบบ fusion ที่ไม่เหมือนใคร'),
  ('about_2_title', 'About: หัวข้อ 2',    'text',  'ABOUT THE RESTAURANT'),
  ('about_2_desc',  'About: คำบรรยาย 2',  'text',  'Mein Licht สร้างประสบการณ์ที่ผสมผสานวัฒนธรรมเม็กซิกันกับความรักในการทำอาหาร สัมผัสกลิ่นหอมของ spices และความร้อนแรงของ grill ที่จะทำให้คุณหลงใหล'),
  ('about_3_title', 'About: หัวข้อ 3',    'text',  'OUR STORY'),
  ('about_3_desc',  'About: คำบรรยาย 3',  'text',  'ภาษาภาพของเราดึงแรงบันดาลใจจากวัฒนธรรมที่มีชีวิตชีวา สร้างโลกที่เต็มไปด้วยรสชาติ สีสัน และความสนุกสนาน'),
  -- Gallery Images (8 images: 2 rows x 4 cols, staggered)
  ('gallery_1', 'Gallery ช่องที่ 1 (แถว 1, สูง)',  'image', 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&q=80'),
  ('gallery_2', 'Gallery ช่องที่ 2 (แถว 1, เตี้ย)', 'image', 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=600&q=80'),
  ('gallery_3', 'Gallery ช่องที่ 3 (แถว 1, สูง)',  'image', 'https://images.unsplash.com/photo-1604467715878-83e57e8bc129?w=600&q=80'),
  ('gallery_4', 'Gallery ช่องที่ 4 (แถว 1, เตี้ย)', 'image', 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=600&q=80'),
  ('gallery_5', 'Gallery ช่องที่ 5 (แถว 2, เตี้ย)', 'image', 'https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?w=600&q=80'),
  ('gallery_6', 'Gallery ช่องที่ 6 (แถว 2, สูง)',  'image', 'https://images.unsplash.com/photo-1582169296194-e4d644c48063?w=600&q=80'),
  ('gallery_7', 'Gallery ช่องที่ 7 (แถว 2, เตี้ย)', 'image', 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80'),
  ('gallery_8', 'Gallery ช่องที่ 8 (แถว 2, สูง)',  'image', 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&q=80')
ON CONFLICT (key) DO NOTHING;

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_restaurant_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_restaurant_settings ON public.restaurant_settings;
CREATE TRIGGER trg_update_restaurant_settings
  BEFORE UPDATE ON public.restaurant_settings
  FOR EACH ROW EXECUTE FUNCTION update_restaurant_settings_timestamp();
