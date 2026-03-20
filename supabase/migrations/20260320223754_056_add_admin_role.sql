/*
  # Add Admin Role

  ## Summary
  Adds the `admin` role to the user_role enum so platform admins can be
  assigned a proper role rather than relying on a hardcoded username check.

  ## Changes

  ### 1. New Enum Value
  - Adds `admin` to the `user_role` enum, sitting alongside `hobbyist`,
    `vendor`, `farm`, and `moderator`

  ## Notes
  - No data migration needed; existing rows are unaffected
  - Access control in the app layer should check `role IN ('admin')` for
    admin pages and `role IN ('admin', 'moderator')` for moderation actions
*/

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'admin';
