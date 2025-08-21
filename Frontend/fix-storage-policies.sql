-- Fix Storage Upload Policies for topic-pdfs bucket
-- Run these commands in Supabase SQL Editor

-- 1. Ensure bucket exists and is public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('topic-pdfs', 'topic-pdfs', true, 52428800, ARRAY['application/pdf'])
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['application/pdf'];

-- 2. Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing conflicting policies (if any)
DROP POLICY IF EXISTS "Allow authenticated users to upload files" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own files" ON storage.objects;
DROP POLICY IF EXISTS "topic-pdfs upload policy" ON storage.objects;
DROP POLICY IF EXISTS "topic-pdfs read policy" ON storage.objects;

-- 4. Create upload policy for authenticated users
CREATE POLICY "topic-pdfs upload policy" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'topic-pdfs' 
  AND auth.role() = 'authenticated'
);

-- 5. Create read policy for everyone (since bucket is public)
CREATE POLICY "topic-pdfs read policy" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'topic-pdfs');

-- 6. Create update policy for file owners
CREATE POLICY "topic-pdfs update policy" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'topic-pdfs' AND auth.uid() = owner)
WITH CHECK (bucket_id = 'topic-pdfs' AND auth.uid() = owner);

-- 7. Create delete policy for file owners
CREATE POLICY "topic-pdfs delete policy" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'topic-pdfs' AND auth.uid() = owner);

-- 8. Verify the policies were created
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual, 
  with_check 
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname LIKE '%topic-pdfs%';

-- 9. Verify bucket configuration
SELECT id, name, public, file_size_limit, allowed_mime_types 
FROM storage.buckets 
WHERE id = 'topic-pdfs'; 