/*
  # Add asking_price to have_list and last_seen_at to profiles

  1. Changes
    - `have_list`: adds `asking_price` (numeric, nullable) so traders can specify a cash value for their coral
    - `profiles`: adds `last_seen_at` (timestamptz) to track online presence
      - Updated by the client whenever a user is active on the platform
      - Used to show "online" badge for users active within the last 10 minutes

  2. Security
    - No new tables — existing RLS policies cover these columns
    - Profiles update policy already allows users to update their own row
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'have_list' AND column_name = 'asking_price'
  ) THEN
    ALTER TABLE have_list ADD COLUMN asking_price numeric DEFAULT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'last_seen_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN last_seen_at timestamptz DEFAULT NULL;
  END IF;
END $$;
