/*
  # Allow admins and moderators to update/delete trade list entries

  ## Problem
  The UPDATE and DELETE policies on have_list and want_list only allow
  users to modify their own records. Admins and moderators in the mod
  panel could not save changes to other users' entries.

  ## Changes
  - Add UPDATE policy on have_list for admins/moderators
  - Add UPDATE policy on want_list for admins/moderators
  - Add DELETE policy on have_list for admins/moderators
  - Add DELETE policy on want_list for admins/moderators

  Roles checked: 'admin' or 'moderator' in the profiles table.
*/

CREATE POLICY "Admins and moderators can update any have list entry"
  ON have_list FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role IN ('admin', 'moderator')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Admins and moderators can update any want list entry"
  ON want_list FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role IN ('admin', 'moderator')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Admins and moderators can delete any have list entry"
  ON have_list FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Admins and moderators can delete any want list entry"
  ON want_list FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role IN ('admin', 'moderator')
    )
  );
