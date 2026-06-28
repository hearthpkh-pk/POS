-- 00020_add_image_url_to_modifier_options.sql
-- Add image_url column to modifier_options table

ALTER TABLE public.modifier_options 
ADD COLUMN IF NOT EXISTS image_url VARCHAR(500) DEFAULT NULL;
