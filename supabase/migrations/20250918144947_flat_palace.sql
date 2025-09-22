/*
  # Create quest categories table

  1. New Tables
    - `quest_categories`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `description` (text)
      - `icon` (text)
      - `color` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `quest_categories` table
    - Add policy for public read access to categories
*/

CREATE TABLE IF NOT EXISTS quest_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  color text NOT NULL DEFAULT '#B8FF00',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE quest_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are viewable by everyone"
  ON quest_categories
  FOR SELECT
  TO public
  USING (true);

-- Insert the 8 quest categories
INSERT INTO quest_categories (name, description, icon, color) VALUES
  ('Skill Quests', 'Learn or practice a new skill, from handstands to cooking', '⚔️', '#FF6B6B'),
  ('Creative Quests', 'Express yourself through art, writing, music, or making', '🎭', '#4ECDC4'),
  ('Adventure Quests', 'Explore outdoors or try unique experiences in new places', '🌍', '#45B7D1'),
  ('Self-Discovery Quests', 'Reflect, journal, meditate, or challenge your mindset', '🧘', '#96CEB4'),
  ('Mini Quests', 'Quick, fun challenges that take minutes but break routine', '⚡', '#FFEAA7'),
  ('IRL Challenges', 'Gamify daily life with dice rolls, coin flips, or speed runs', '🕹', '#DDA0DD'),
  ('Social Quests', 'Activities with friends, strangers, or groups that build connection', '🤝', '#98D8C8'),
  ('Local Gems', 'Location-based quests highlighting unique spots near you', '📍', '#F7DC6F');