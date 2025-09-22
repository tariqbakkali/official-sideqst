/*
  # Add image support to sidequests

  1. Changes
    - Add `image_url` column to sidequests table for quest images
    - Column is optional (nullable) so existing quests aren't affected
*/

-- Add image_url column to sidequests table
ALTER TABLE sidequests ADD COLUMN IF NOT EXISTS image_url text;

-- Add comment to document the column
COMMENT ON COLUMN sidequests.image_url IS 'Optional URL to an image representing the quest';