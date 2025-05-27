
-- Create storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-files', 'user-files', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Allow authenticated users to upload files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to view files" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update own files" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete own files" ON storage.objects;
DROP POLICY IF EXISTS "Allow public to view files" ON storage.objects;

-- Create policies for the user-files bucket
CREATE POLICY "Allow authenticated uploads to user-files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'user-files');

CREATE POLICY "Allow authenticated select from user-files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'user-files');

CREATE POLICY "Allow public select from user-files"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'user-files');

CREATE POLICY "Allow authenticated update in user-files"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'user-files');

CREATE POLICY "Allow authenticated delete from user-files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'user-files');
