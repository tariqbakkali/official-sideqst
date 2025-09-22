/*
  # Create sidequests table

  1. New Tables
    - `sidequests`
      - `id` (uuid, primary key)
      - `name` (text, quest title)
      - `description` (text, quest instructions)
      - `category_id` (uuid, foreign key to quest_categories)
      - `duration` (integer, estimated minutes)
      - `difficulty` (integer, 1-5 scale)
      - `uniqueness` (integer, 1-5 scale)
      - `location_type` (enum: anywhere, address, online)
      - `location_text` (text, location details)
      - `created_by` (uuid, foreign key to auth.users, nullable)
      - `is_public` (boolean, visibility setting)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `sidequests` table
    - Add policies for public quest viewing and user quest management
*/

-- Create enum for location types
CREATE TYPE location_type_enum AS ENUM ('anywhere', 'address', 'online');

-- Create sidequests table
CREATE TABLE IF NOT EXISTS sidequests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  category_id uuid NOT NULL REFERENCES quest_categories(id),
  duration integer NOT NULL DEFAULT 30,
  difficulty integer NOT NULL DEFAULT 1 CHECK (difficulty >= 1 AND difficulty <= 5),
  uniqueness integer NOT NULL DEFAULT 1 CHECK (uniqueness >= 1 AND uniqueness <= 5),
  location_type location_type_enum NOT NULL DEFAULT 'anywhere',
  location_text text DEFAULT '',
  created_by uuid REFERENCES auth.users(id),
  is_public boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE sidequests ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public sidequests are viewable by everyone"
  ON sidequests
  FOR SELECT
  TO public
  USING (is_public = true);

CREATE POLICY "Users can view their own sidequests"
  ON sidequests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Users can create sidequests"
  ON sidequests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own sidequests"
  ON sidequests
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete their own sidequests"
  ON sidequests
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);