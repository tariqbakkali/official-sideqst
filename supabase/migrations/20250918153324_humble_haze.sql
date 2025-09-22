/*
  # Add cost and photo_url to sidequests table

  1. Changes
    - Add `cost` column (decimal) for quest expenses
    - Add `photo_url` column (text) for quest images
    - Both columns are nullable/optional
*/

-- Add cost column for quest expenses
ALTER TABLE sidequests ADD COLUMN IF NOT EXISTS cost DECIMAL(10,2);

-- Add photo_url column for quest images  
ALTER TABLE sidequests ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Add comments for documentation
COMMENT ON COLUMN sidequests.cost IS 'Estimated cost to complete the quest in dollars';
COMMENT ON COLUMN sidequests.photo_url IS 'URL to quest image/photo';