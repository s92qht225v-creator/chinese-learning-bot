-- Add thumbnail_url column to lessons table
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- Add audio_url column to lessons table (if not exists from supabase-schema.sql)
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS audio_url TEXT;

-- Create storage buckets for audio and thumbnails
-- Note: These need to be created in Supabase Dashboard or via SQL
-- Storage buckets creation:
-- 1. Go to Supabase Dashboard > Storage
-- 2. Create bucket named 'audio' with public access
-- 3. Create bucket named 'thumbnails' with public access

-- Or run these commands in Supabase SQL Editor:
-- insert into storage.buckets (id, name, public) values ('audio', 'audio', true);
-- insert into storage.buckets (id, name, public) values ('thumbnails', 'thumbnails', true);

-- Set up storage policies for public access
-- For audio bucket
CREATE POLICY "Public Access for audio" ON storage.objects FOR SELECT USING (bucket_id = 'audio');
CREATE POLICY "Authenticated users can upload audio" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'audio' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update audio" ON storage.objects FOR UPDATE USING (bucket_id = 'audio' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete audio" ON storage.objects FOR DELETE USING (bucket_id = 'audio' AND auth.role() = 'authenticated');

-- For thumbnails bucket
CREATE POLICY "Public Access for thumbnails" ON storage.objects FOR SELECT USING (bucket_id = 'thumbnails');
CREATE POLICY "Authenticated users can upload thumbnails" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'thumbnails' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update thumbnails" ON storage.objects FOR UPDATE USING (bucket_id = 'thumbnails' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete thumbnails" ON storage.objects FOR DELETE USING (bucket_id = 'thumbnails' AND auth.role() = 'authenticated');
