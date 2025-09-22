/*
  # Create Nearby Quests Function

  1. Function Purpose
    - Calculate distance between user location and quest locations
    - Return quests within specified radius
    - Use Haversine formula for accurate distance calculation
  
  2. Parameters
    - user_lat: User's latitude
    - user_lng: User's longitude  
    - radius_km: Search radius in kilometers (default 10km)
    - quest_limit: Maximum number of results (default 20)
  
  3. Returns
    - Quests with calculated distance
    - Ordered by distance (closest first)
    - Only includes address-type quests with coordinates
*/

-- Create function to find nearby quests using Haversine formula
CREATE OR REPLACE FUNCTION get_nearby_quests(
  user_lat NUMERIC,
  user_lng NUMERIC,
  radius_km NUMERIC DEFAULT 10,
  quest_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  category_id UUID,
  difficulty INTEGER,
  uniqueness INTEGER,
  location_type location_type_enum,
  location_text TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  created_by UUID,
  is_public BOOLEAN,
  cost NUMERIC,
  photo_url TEXT,
  duration_value INTEGER,
  duration_unit duration_unit_enum,
  created_at TIMESTAMPTZ,
  distance_km NUMERIC
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.name,
    s.description,
    s.category_id,
    s.difficulty,
    s.uniqueness,
    s.location_type,
    s.location_text,
    s.latitude,
    s.longitude,
    s.created_by,
    s.is_public,
    s.cost,
    s.photo_url,
    s.duration_value,
    s.duration_unit,
    s.created_at,
    -- Haversine formula for distance calculation
    (
      6371 * acos(
        cos(radians(user_lat)) * 
        cos(radians(s.latitude)) * 
        cos(radians(s.longitude) - radians(user_lng)) + 
        sin(radians(user_lat)) * 
        sin(radians(s.latitude))
      )
    )::NUMERIC(10,2) AS distance_km
  FROM sidequests s
  WHERE 
    s.is_public = true
    AND s.location_type = 'address'
    AND s.latitude IS NOT NULL 
    AND s.longitude IS NOT NULL
    AND (
      6371 * acos(
        cos(radians(user_lat)) * 
        cos(radians(s.latitude)) * 
        cos(radians(s.longitude) - radians(user_lng)) + 
        sin(radians(user_lat)) * 
        sin(radians(s.latitude))
      )
    ) <= radius_km
  ORDER BY distance_km ASC
  LIMIT quest_limit;
END;
$$;