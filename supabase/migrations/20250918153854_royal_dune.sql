/*
  # Update Duration Fields in Sidequests Table

  1. Changes
    - Remove the existing `duration` integer column
    - Add `duration_value` integer column for the numerical value
    - Add `duration_unit` enum column for time units (minutes, hours, days, weeks, months)
    - Set default values for better user experience

  2. Security
    - Maintains existing RLS policies
    - No changes to permissions
*/

-- Create enum for duration units
DO $$ BEGIN
  CREATE TYPE duration_unit_enum AS ENUM ('minutes', 'hours', 'days', 'weeks', 'months');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Remove the old duration column and add new duration fields
DO $$
BEGIN
  -- Drop the old duration column if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sidequests' AND column_name = 'duration'
  ) THEN
    ALTER TABLE sidequests DROP COLUMN duration;
  END IF;

  -- Add duration_value column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sidequests' AND column_name = 'duration_value'
  ) THEN
    ALTER TABLE sidequests ADD COLUMN duration_value integer DEFAULT 30;
  END IF;

  -- Add duration_unit column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sidequests' AND column_name = 'duration_unit'
  ) THEN
    ALTER TABLE sidequests ADD COLUMN duration_unit duration_unit_enum DEFAULT 'minutes';
  END IF;
END $$;

-- Add check constraint to ensure duration_value is positive
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'sidequests_duration_value_check'
  ) THEN
    ALTER TABLE sidequests ADD CONSTRAINT sidequests_duration_value_check CHECK (duration_value > 0);
  END IF;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN sidequests.duration_value IS 'Numerical value for quest duration (e.g., 30 for "30 minutes")';
COMMENT ON COLUMN sidequests.duration_unit IS 'Time unit for quest duration (minutes, hours, days, weeks, months)';