/*
  # Add Storage Policies for Quest Photos

  1. Storage Policies
    - Allow authenticated users to upload photos to their own folder
    - Allow authenticated users to update their own photos
    - Allow authenticated users to delete their own photos
    - Allow anyone to view quest photos (public bucket)
*/

-- Policy: Allow authenticated users to upload quest photos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can upload quest photos'
  ) THEN
    CREATE POLICY "Users can upload quest photos"
      ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'quest-photos' AND
        auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;
END $$;

-- Policy: Allow authenticated users to update their own quest photos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can update own quest photos'
  ) THEN
    CREATE POLICY "Users can update own quest photos"
      ON storage.objects
      FOR UPDATE
      TO authenticated
      USING (
        bucket_id = 'quest-photos' AND
        auth.uid()::text = (storage.foldername(name))[1]
      )
      WITH CHECK (
        bucket_id = 'quest-photos' AND
        auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;
END $$;

-- Policy: Allow authenticated users to delete their own quest photos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can delete own quest photos'
  ) THEN
    CREATE POLICY "Users can delete own quest photos"
      ON storage.objects
      FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'quest-photos' AND
        auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;
END $$;

-- Policy: Allow anyone to view quest photos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Anyone can view quest photos'
  ) THEN
    CREATE POLICY "Anyone can view quest photos"
      ON storage.objects
      FOR SELECT
      TO public
      USING (bucket_id = 'quest-photos');
  END IF;
END $$;