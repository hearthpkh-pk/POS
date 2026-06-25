-- Migration: Update gallery labels to Recommended/Promotional Menu labels
-- Filename: 00010_update_gallery_labels.sql

UPDATE public.restaurant_settings
SET label = CASE
  WHEN key = 'gallery_1' THEN 'แนะนำ/โปรโมชัน ช่องที่ 1'
  WHEN key = 'gallery_2' THEN 'แนะนำ/โปรโมชัน ช่องที่ 2'
  WHEN key = 'gallery_3' THEN 'แนะนำ/โปรโมชัน ช่องที่ 3'
  WHEN key = 'gallery_4' THEN 'แนะนำ/โปรโมชัน ช่องที่ 4'
  WHEN key = 'gallery_5' THEN 'แนะนำ/โปรโมชัน ช่องที่ 5'
  WHEN key = 'gallery_6' THEN 'แนะนำ/โปรโมชัน ช่องที่ 6'
  WHEN key = 'gallery_7' THEN 'แนะนำ/โปรโมชัน ช่องที่ 7'
  WHEN key = 'gallery_8' THEN 'แนะนำ/โปรโมชัน ช่องที่ 8'
END
WHERE key IN ('gallery_1', 'gallery_2', 'gallery_3', 'gallery_4', 'gallery_5', 'gallery_6', 'gallery_7', 'gallery_8');
