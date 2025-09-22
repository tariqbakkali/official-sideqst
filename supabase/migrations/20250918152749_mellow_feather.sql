/*
  # Create sidequests table

  1. New Tables
    - `sidequests`
      - `id` (uuid, primary key)
      - `name` (text) - Short title for the quest
      - `description` (text) - Longer explanation/instructions
      - `category_id` (uuid, foreign key) - References quest_categories table
      - `duration` (integer) - Estimated time in minutes
      - `difficulty` (integer, 1-5) - Difficulty rating
      - `uniqueness` (integer, 1-5) - How unusual/special the quest is
      - `location_type` (enum) - anywhere, address, or online
      - `location_text` (text) - Freeform location string
      - `created_by` (uuid, nullable foreign key) - User ID or null for system quests
      - `is_public` (boolean) - Whether others can see it
      - `created_at` (timestamp) - When it was created

  2. Security
    - Enable RLS on `sidequests` table
    - Add policies for public quest viewing and user quest management
    - Add policies for authenticated users to create quests

  3. Sample Data
    - Add 8 sample sidequests (one per category) to populate the app
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
  location_text text DEFAULT 'anywhere',
  created_by uuid REFERENCES auth.users(id),
  is_public boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE sidequests ENABLE ROW LEVEL SECURITY;

-- Policies for sidequests
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

-- Insert sample sidequests (one per category)
INSERT INTO sidequests (name, description, category_id, duration, difficulty, uniqueness, location_type, location_text, created_by, is_public) VALUES
(
  'Learn Basic Handstand',
  'Practice handstand holds against a wall for 30 seconds. Start with wall-supported holds and gradually work toward freestanding balance.',
  (SELECT id FROM quest_categories WHERE name = 'Skill Quests'),
  45,
  3,
  2,
  'anywhere',
  'Any space with a wall',
  NULL,
  true
),
(
  'Create a Daily Sketch',
  'Draw something new every day for a week. It can be anything - objects around you, people, landscapes, or abstract art.',
  (SELECT id FROM quest_categories WHERE name = 'Creative Quests'),
  30,
  2,
  3,
  'anywhere',
  'anywhere',
  NULL,
  true
),
(
  'Sunrise Mountain Hike',
  'Wake up early and hike to a viewpoint to watch the sunrise. Bring a thermos of coffee and enjoy the peaceful morning.',
  (SELECT id FROM quest_categories WHERE name = 'Adventure Quests'),
  180,
  4,
  4,
  'address',
  'Local hiking trail with elevation',
  NULL,
  true
),
(
  'Digital Detox Day',
  'Spend 24 hours without social media, news, or entertainment apps. Focus on reading, journaling, or spending time in nature.',
  (SELECT id FROM quest_categories WHERE name = 'Self-Discovery Quests'),
  1440,
  3,
  3,
  'anywhere',
  'anywhere',
  NULL,
  true
),
(
  'Random Act of Kindness',
  'Perform one unexpected act of kindness for a stranger today. Pay for someone''s coffee, help carry groceries, or leave an encouraging note.',
  (SELECT id FROM quest_categories WHERE name = 'Mini Quests'),
  15,
  1,
  4,
  'anywhere',
  'Public spaces',
  NULL,
  true
),
(
  'Dice Roll Adventure',
  'Roll a dice to determine your evening activity: 1-2 cook a new recipe, 3-4 call an old friend, 5-6 take a night walk.',
  (SELECT id FROM quest_categories WHERE name = 'IRL Challenges'),
  60,
  2,
  5,
  'anywhere',
  'anywhere',
  NULL,
  true
),
(
  'Coffee Shop Conversations',
  'Visit 3 different coffee shops this week and have a genuine conversation with someone new at each one.',
  (SELECT id FROM quest_categories WHERE name = 'Social Quests'),
  120,
  3,
  3,
  'address',
  'Local coffee shops',
  NULL,
  true
),
(
  'Hidden Neighborhood Gem',
  'Explore a 3-block radius around your home and find one place you''ve never been before. Document it with photos and notes.',
  (SELECT id FROM quest_categories WHERE name = 'Local Gems'),
  90,
  2,
  4,
  'address',
  'Your neighborhood',
  NULL,
  true
);