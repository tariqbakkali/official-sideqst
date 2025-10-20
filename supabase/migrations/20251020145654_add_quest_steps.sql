/*
  # Add Quest Steps/Progression System

  1. New Tables
    - `quest_steps`
      - `id` (uuid, primary key)
      - `quest_id` (uuid, foreign key to sidequests)
      - `step_order` (integer) - Order of the step (1, 2, 3, etc.)
      - `title` (text) - Name of the step/milestone
      - `description` (text, optional) - Details about this step
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `user_quest_step_progress`
      - `id` (uuid, primary key)
      - `user_quest_id` (uuid, foreign key to sidequests) - references user's copy of quest
      - `step_order` (integer) - Which step this progress is for
      - `completed_at` (timestamptz, nullable)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Users can read steps for any public quest
    - Only quest creators can create/modify steps
    - Users can manage their own step progress

  3. Notes
    - Quest steps are templates defined by quest creators
    - When users copy a quest, they track progress on each step independently
    - Steps support progressive achievements (e.g., 10 sec, 30 sec, 1 min handstand)
*/

-- Create quest_steps table
CREATE TABLE IF NOT EXISTS quest_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quest_id uuid REFERENCES sidequests(id) ON DELETE CASCADE NOT NULL,
  step_order integer NOT NULL,
  title text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(quest_id, step_order)
);

-- Create user_quest_step_progress table
CREATE TABLE IF NOT EXISTS user_quest_step_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_quest_id uuid REFERENCES sidequests(id) ON DELETE CASCADE NOT NULL,
  step_order integer NOT NULL,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_quest_id, step_order)
);

-- Enable RLS
ALTER TABLE quest_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_quest_step_progress ENABLE ROW LEVEL SECURITY;

-- Policies for quest_steps
CREATE POLICY "Anyone can view quest steps"
  ON quest_steps
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Quest creators can insert steps"
  ON quest_steps
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sidequests
      WHERE sidequests.id = quest_id
      AND sidequests.created_by = auth.uid()
    )
  );

CREATE POLICY "Quest creators can update their quest steps"
  ON quest_steps
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sidequests
      WHERE sidequests.id = quest_id
      AND sidequests.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sidequests
      WHERE sidequests.id = quest_id
      AND sidequests.created_by = auth.uid()
    )
  );

CREATE POLICY "Quest creators can delete their quest steps"
  ON quest_steps
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sidequests
      WHERE sidequests.id = quest_id
      AND sidequests.created_by = auth.uid()
    )
  );

-- Policies for user_quest_step_progress
CREATE POLICY "Users can view their own step progress"
  ON user_quest_step_progress
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sidequests
      WHERE sidequests.id = user_quest_id
      AND sidequests.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own step progress"
  ON user_quest_step_progress
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sidequests
      WHERE sidequests.id = user_quest_id
      AND sidequests.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can update their own step progress"
  ON user_quest_step_progress
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sidequests
      WHERE sidequests.id = user_quest_id
      AND sidequests.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sidequests
      WHERE sidequests.id = user_quest_id
      AND sidequests.created_by = auth.uid()
    )
  );

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_quest_steps_quest_id ON quest_steps(quest_id);
CREATE INDEX IF NOT EXISTS idx_quest_steps_order ON quest_steps(quest_id, step_order);
CREATE INDEX IF NOT EXISTS idx_user_quest_step_progress_user_quest ON user_quest_step_progress(user_quest_id);
CREATE INDEX IF NOT EXISTS idx_user_quest_step_progress_order ON user_quest_step_progress(user_quest_id, step_order);