/*
  # Add is_locked to Listings

  ## Summary
  Adds a `is_locked` boolean flag to the `listings` table so admins can
  lock listings without removing them. A locked listing remains visible
  to all users but cannot be edited or deleted by the seller.

  ## Changes

  ### Modified Tables
  - `listings`
    - `is_locked` (boolean, DEFAULT false) — when true, the seller cannot
      edit or delete the listing; only admins can change this flag

  ## Notes
  - Existing rows default to false (unlocked)
  - The frontend enforces the lock; no additional RLS policy changes are
    required because admins bypass RLS in the service-role context
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'listings' AND column_name = 'is_locked'
  ) THEN
    ALTER TABLE listings ADD COLUMN is_locked boolean NOT NULL DEFAULT false;
  END IF;
END $$;
