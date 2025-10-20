/*
  # Add find_nearby_quests function with miles support

  1. Function Purpose
    - Find quests within a specified radius from user's location
    - Uses miles instead of kilometers for distance
    - Returns quest data with distance in miles
  
  2. Parameters
    - user_lat: User's latitude
    - user_lng: User's longitude
    - radius_miles: Search radius in miles (default 10)
    - quest_limit: Maximum number of results (default 50)
  
  3. Returns
    - All quest fields
    - distance_miles: Calculated distance from user in miles
    - Sorted by distance (closest first)
*/

CREATE OR REPLACE FUNCTION find_nearby_quests(
  user_lat NUMERIC,
  user_lng NUMERIC,
  radius_miles NUMERIC DEFAULT 10,
  quest_limit INTEGER DEFAULT 50
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
  distance_miles NUMERIC
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
    -- Haversine formula for distance calculation in miles
    (
      3959 * acos(
        LEAST(1.0, 
          cos(radians(user_lat)) * 
          cos(radians(s.latitude)) * 
          cos(radians(s.longitude) - radians(user_lng)) + 
          sin(radians(user_lat)) * 
          sin(radians(s.latitude))
        )
      )
    )::NUMERIC(10,2) AS distance_miles
  FROM sidequests s
  WHERE 
    s.is_public = true
    AND s.location_type = 'address'
    AND s.latitude IS NOT NULL 
    AND s.longitude IS NOT NULL
    AND (
      3959 * acos(
        LEAST(1.0,
          cos(radians(user_lat)) * 
          cos(radians(s.latitude)) * 
          cos(radians(s.longitude) - radians(user_lng)) + 
          sin(radians(user_lat)) * 
          sin(radians(s.latitude))
        )
      )
    ) <= radius_miles
  ORDER BY distance_miles ASC
  LIMIT quest_limit;
END;
$$;