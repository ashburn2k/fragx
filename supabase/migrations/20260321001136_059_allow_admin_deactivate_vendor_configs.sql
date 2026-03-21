/*
  # Allow admins to update vendor scrape configs

  1. Changes
    - Adds an UPDATE policy on `vendor_scrape_configs` for admin users
    - Admins (role = 'admin' in profiles) can toggle `is_active` on vendors
    - This enables the stale vendor deactivation workflow in the admin panel

  2. Security
    - Policy checks profiles.role = 'admin' via auth.uid()
    - Non-admin authenticated users cannot modify vendor configs
    - Public (unauthenticated) users cannot modify vendor configs
*/

CREATE POLICY "Admins can update vendor configs"
  ON vendor_scrape_configs FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
