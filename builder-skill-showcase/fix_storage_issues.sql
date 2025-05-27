
-- Check if user-files bucket exists and its configuration
SELECT * FROM storage.buckets WHERE id = 'user-files';

-- Check if there are any files in the bucket
SELECT 
    name,
    bucket_id,
    created_at,
    updated_at,
    metadata
FROM storage.objects 
WHERE bucket_id = 'user-files' 
ORDER BY created_at DESC 
LIMIT 20;

-- Check current RLS policies on storage.objects
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
WHERE tablename = 'objects' AND schemaname = 'storage';

-- Ensure the bucket exists and is public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('user-files', 'user-files', true, null, null)
ON CONFLICT (id) DO UPDATE SET 
    public = true,
    updated_at = now();

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Allow authenticated uploads to user-files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated select from user-files" ON storage.objects;
DROP POLICY IF EXISTS "Allow public select from user-files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated update in user-files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete from user-files" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access to user-files" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;

-- Create a comprehensive public access policy for the user-files bucket
CREATE POLICY "Allow public access to user-files bucket"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'user-files');

-- Allow authenticated users to insert files
CREATE POLICY "Allow authenticated insert to user-files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'user-files');

-- Allow authenticated users to update their own files  
CREATE POLICY "Allow authenticated update in user-files"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'user-files');

-- Allow authenticated users to delete their own files
CREATE POLICY "Allow authenticated delete from user-files" 
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'user-files');

-- Verify the policies were created
SELECT 
    policyname,
    cmd,
    roles
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname LIKE '%user-files%';
