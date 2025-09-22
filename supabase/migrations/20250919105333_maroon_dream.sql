/*
  # Update quest completion to support multiple photos

  1. Changes
    - Drop the single completion_photo_url column
    - Add completion_photos column to store JSON array of photo URLs
    - Update existing data if any exists

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
WHERE completion_photo_url IS NOT NULL AND completion_photo_url != '';

-- Drop the old column if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sidequests' AND column_name = 'completion_photo_url'
  ) THEN
    ALTER TABLE sidequests DROP COLUMN completion_photo_url;
  END IF;
END $$;