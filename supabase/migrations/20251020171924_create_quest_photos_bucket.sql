/*
  # Create Quest Photos Storage Bucket

  1. Storage Bucket
    - Create 'quest-photos' bucket if it doesn't exist
    - Set bucket to public so photos are viewable
    - Configure for file uploads

  2. Notes
    - Policies for this bucket already exist in a previous migration
    - This migration ensures the bucket exists before policies are applied
*/

-- Create the quest-photos bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'quest-photos',
  'quest-photos',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic']
)
ON CONFLICT (id) DO NOTHING;