/*
  # Add quest completion tracking fields

  1. New Columns
    - `is_completed` (boolean, default false) - Tracks if quest is completed
    - `completed_at` (timestamptz) - When quest was completed
    - `completion_notes` (text) - User notes when completing quest
    - `completion_photo_url` (text) - URL to completion photo

  2. Security
    - No RLS changes needed as these are just additional columns on existing table
*/

-- Add completion tracking columns to sidequests table
DO $$
BEGIN
  -- Add is_completed column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sidequests' AND column_name = 'is_completed'
  ) THEN
    ALTER TABLE sidequests ADD COLUMN is_completed boolean DEFAULT false NOT NULL;
  END IF;

  -- Add completed_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sidequests' AND column_name = 'completed_at'
  ) THEN
    ALTER TABLE sidequests ADD COLUMN completed_at timestamptz;
  END IF;

  -- Add completion_notes column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sidequests' AND column_name = 'completion_notes'
  ) THEN
    ALTER TABLE sidequests ADD COLUMN completion_notes text;
  END IF;

  -- Add completion_photo_url column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sidequests' AND column_name = 'completion_photo_url'
  ) THEN
    ALTER TABLE sidequests ADD COLUMN completion_photo_url text;
  END IF;
END $$;