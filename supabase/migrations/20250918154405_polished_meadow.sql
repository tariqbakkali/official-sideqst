/*
  # Add Location Coordinates to Sidequests

  1. New Columns
    - `latitude` (numeric) - Latitude coordinate for address-type locations
    - `longitude` (numeric) - Longitude coordinate for address-type locations
  
  2. Purpose
    - Enable proximity-based quest suggestions
    - Allow geographical queries for nearby quests
    - Support location-based filtering and recommendations
  
  3. Usage
    - Only populated when location_type = 'address'
    - Used with OpenStreetMap Nominatim for geocoding
    - Enables distance calculations for quest discovery
*/

-- Add latitude and longitude columns for geographical coordinates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sidequests' AND column_name = 'latitude'
  ) THEN
    ALTER TABLE sidequests ADD COLUMN latitude NUMERIC(10, 8);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sidequests' AND column_name = 'longitude'
  ) THEN
    ALTER TABLE sidequests ADD COLUMN longitude NUMERIC(11, 8);
  END IF;
END $$;

-- Add comments to document the new columns
COMMENT ON COLUMN sidequests.latitude IS 'Latitude coordinate for address-type locations (used for proximity searches)';
COMMENT ON COLUMN sidequests.longitude IS 'Longitude coordinate for address-type locations (used for proximity searches)';

-- Create an index for efficient geographical queries
CREATE INDEX IF NOT EXISTS idx_sidequests_location 
ON sidequests (latitude, longitude) 
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;