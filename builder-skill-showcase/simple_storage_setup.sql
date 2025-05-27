
-- Simple storage setup that should work with basic permissions

-- Make sure the bucket exists and is public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'user-files';

-- If the above fails, you can create the bucket manually in Supabase Dashboard:
-- 1. Go to Storage in Supabase Dashboard
-- 2. Create a new bucket called 'user-files'
-- 3. Make it public
-- 4. The file upload should work without additional policies for public buckets
