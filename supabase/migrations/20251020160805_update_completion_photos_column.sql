/*
  # Update quest completion to support multiple photos

  1. Changes
    - Add completion_photos column to store JSON array of photo URLs
    - Migrate existing completion_photo_url data to completion_photos array
    - Keep completion_photo_url for backward compatibility

  2. Security
    - No changes to RLS policies needed
*/

-- Add new completion_photos column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sidequests' AND column_name = 'completion_photos'
  ) THEN
    ALTER TABLE sidequests ADD COLUMN completion_photos jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Migrate existing completion_photo_url data to completion_photos array
UPDATE sidequests 
SET completion_photos = jsonb_build_array(completion_photo_url)
WHERE completion_photo_url IS NOT NULL 
  AND completion_photo_url != '' 
  AND (completion_photos IS NULL OR completion_photos = '[]'::jsonb);

-- Add comment
COMMENT ON COLUMN sidequests.completion_photos IS 'Array of photo URLs from quest completion (up to 5 photos)';
