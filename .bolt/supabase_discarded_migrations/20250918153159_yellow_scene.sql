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
      - `location_type` (enum, anywhere/address/online)
      - `location_text` (text, location details)
      - `created_by` (uuid, nullable, foreign key to users)
      - `is_public` (boolean, visibility setting)
      - `image_url` (text, optional quest image)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `sidequests` table
    - Add policies for public quest viewing
    - Add policies for user quest management
*/

-- Create sidequests table
CREATE TABLE IF NOT EXISTS sidequests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  category_id uuid NOT NULL REFERENCES quest_categories(id),
  duration integer NOT NULL DEFAULT 30,
  difficulty integer NOT NULL DEFAULT 1,
  uniqueness integer NOT NULL DEFAULT 1,
  location_type location_type_enum NOT NULL DEFAULT 'anywhere',
  location_text text DEFAULT 'anywhere',
  created_by uuid REFERENCES users(id),
  is_public boolean NOT NULL DEFAULT true,
  image_url text,
  created_at timestamptz DEFAULT now()
);

-- Add constraints
ALTER TABLE sidequests ADD CONSTRAINT sidequests_difficulty_check 
  CHECK (difficulty >= 1 AND difficulty <= 5);

ALTER TABLE sidequests ADD CONSTRAINT sidequests_uniqueness_check 
  CHECK (uniqueness >= 1 AND uniqueness <= 5);

-- Enable RLS
ALTER TABLE sidequests ENABLE ROW LEVEL SECURITY;

-- Policies for public sidequests
CREATE POLICY "Public sidequests are viewable by everyone"
  ON sidequests
  FOR SELECT
  TO public
  USING (is_public = true);

-- Policies for authenticated users
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