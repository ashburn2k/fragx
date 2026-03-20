/*
  # Add Moderator Role and User Ban Support

  ## Summary
  Extends the user system to support moderation controls accessible from the admin panel.

  ## Changes

  ### 1. New Enum Value
  - Adds `moderator` to the `user_role` enum so admins can promote users to moderator status

  ### 2. New Columns on `profiles`
  - `is_banned` (boolean, default false) — marks a user as banned from the platform
  - `ban_reason` (text, nullable) — optional explanation for why the user was banned
  - `banned_at` (timestamptz, nullable) — when the ban was applied
  - `banned_by` (uuid, nullable, FK → profiles.id) — which admin/moderator applied the ban

  ## Security
  - RLS on profiles remains unchanged; existing policies still apply
  - Ban state is read-only for regular users; only admins can write it (enforced in app layer)
*/

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'moderator';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_banned'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_banned boolean NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'ban_reason'
  ) THEN
    ALTER TABLE profiles ADD COLUMN ban_reason text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'banned_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN banned_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'banned_by'
  ) THEN
    ALTER TABLE profiles ADD COLUMN banned_by uuid REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_is_banned ON profiles(is_banned) WHERE is_banned = true;
