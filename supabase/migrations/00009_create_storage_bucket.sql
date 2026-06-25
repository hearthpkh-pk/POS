-- Migration: Create restaurant-images storage bucket and configure policies
-- This script creates the storage bucket required for restaurant settings and menu uploads
-- and sets up row-level security (RLS) policies.

-- 1. Create the bucket if it does not exist
insert into storage.buckets (id, name, public)
values ('restaurant-images', 'restaurant-images', true)
on conflict (id) do nothing;

-- 2. Allow public access to read images from the bucket
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'restaurant-images' );

-- 3. Allow uploads (inserts) to the bucket
create policy "Allow Uploads"
on storage.objects for insert
with check ( bucket_id = 'restaurant-images' );

-- 4. Allow updates
create policy "Allow Updates"
on storage.objects for update
using ( bucket_id = 'restaurant-images' );

-- 5. Allow deletes
create policy "Allow Deletes"
on storage.objects for delete
using ( bucket_id = 'restaurant-images' );
