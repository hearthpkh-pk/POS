-- Migration: Add variants column to menu_items table
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS variants JSONB DEFAULT NULL;
