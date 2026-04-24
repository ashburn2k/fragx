/*
  # Add Product Watch Notifications

  ## Summary
  Allows signed-in users to watch vendor products and receive email/SMS notifications
  when price changes or availability changes occur.

  ## New Columns
  - `profiles.phone_number` — optional phone number for SMS notifications

  ## New Tables
  - `product_watches`
    - `id` (uuid, pk)
    - `user_id` (uuid, FK → auth.users)
    - `vendor_slug` (text)
    - `shopify_id` (bigint)
    - `product_title` (text) — denormalized for display
    - `product_handle` (text) — denormalized for URL building
    - `notify_sold_out` (boolean, default true)
    - `notify_price_drop` (boolean, default true)
    - `notify_price_increase` (boolean, default false)
    - `notify_via_email` (boolean, default true)
    - `notify_via_sms` (boolean, default false)
    - `created_at` (timestamptz)
    - UNIQUE(user_id, vendor_slug, shopify_id)

  ## Security
  - RLS enabled on product_watches
  - Users can only view/manage their own watches
*/

-- Add phone number to profiles for SMS notifications
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'phone_number'
  ) THEN
    ALTER TABLE profiles ADD COLUMN phone_number text;
  END IF;
END $$;

-- Product watches table
CREATE TABLE IF NOT EXISTS product_watches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vendor_slug text NOT NULL,
  shopify_id bigint NOT NULL,
  product_title text NOT NULL DEFAULT '',
  product_handle text NOT NULL DEFAULT '',
  notify_sold_out boolean NOT NULL DEFAULT true,
  notify_price_drop boolean NOT NULL DEFAULT true,
  notify_price_increase boolean NOT NULL DEFAULT false,
  notify_via_email boolean NOT NULL DEFAULT true,
  notify_via_sms boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT product_watches_unique_watch UNIQUE (user_id, vendor_slug, shopify_id)
);

CREATE INDEX IF NOT EXISTS idx_product_watches_user_id ON product_watches (user_id);
CREATE INDEX IF NOT EXISTS idx_product_watches_vendor_shopify ON product_watches (vendor_slug, shopify_id);

ALTER TABLE product_watches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own watches"
  ON product_watches FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own watches"
  ON product_watches FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own watches"
  ON product_watches FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own watches"
  ON product_watches FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
