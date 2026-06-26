-- Migration: Add sort_order column to menu_items table
-- Filename: 00016_add_menu_item_sort_order.sql

-- 1. เพิ่มคอลัมน์ sort_order สำหรับจัดเรียงเมนูรายชิ้น
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- 2. ตั้งค่าเริ่มต้นสำหรับสินค้าที่มีอยู่แล้ว โดยจัดเรียงตามวันที่สร้าง (created_at) ภายในแต่ละหมวดหมู่
WITH ordered_items AS (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY category_id ORDER BY created_at ASC) as row_num
    FROM public.menu_items
)
UPDATE public.menu_items
SET sort_order = ordered_items.row_num
FROM ordered_items
WHERE public.menu_items.id = ordered_items.id;
