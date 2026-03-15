/*
  # Vendor Price History

  ## Overview
  Tracks price changes over time for each vendor product. Every time a scrape runs and
  a product's price differs from its last recorded price, a new history record is inserted.
  This enables monthly (or any cadence) price trend charts and change detection.

  ## New Tables

  ### vendor_price_history
  - `id` (uuid, primary key)
  - `vendor_slug` (text) - which vendor
  - `shopify_id` (bigint) - Shopify product ID
  - `handle` (text) - URL slug for linking
  - `title` (text) - product name at time of record
  - `price` (numeric) - the price recorded at this snapshot
  - `compare_at_price` (numeric, nullable) - sale reference price
  - `price_change` (numeric, nullable) - delta vs previous price (+ = increase, - = decrease)
  - `price_change_pct` (numeric, nullable) - percentage change vs previous price
  - `recorded_at` (timestamptz) - when this snapshot was taken

  ## New Column on vendor_scrape_configs

  ### vendor_scrape_configs.last_scraped_at
  Tracks the timestamp of the most recent successful scrape per vendor,
  used to enforce monthly frequency gating.

  ## Security
  - RLS enabled
  - Public read access (price history is public data)
  - Only service role writes via edge function
*/

CREATE TABLE IF NOT EXISTS vendor_price_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_slug text NOT NULL,
  shopify_id bigint NOT NULL,
  handle text NOT NULL,
  title text NOT NULL,
  price numeric(10,2) NOT NULL,
  compare_at_price numeric(10,2) DEFAULT NULL,
  price_change numeric(10,2) DEFAULT NULL,
  price_change_pct numeric(6,2) DEFAULT NULL,
  recorded_at timestamptz DEFAULT now()
);

ALTER TABLE vendor_price_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read vendor price history"
  ON vendor_price_history FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_vph_vendor_shopify ON vendor_price_history(vendor_slug, shopify_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_vph_recorded_at ON vendor_price_history(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_vph_vendor_slug ON vendor_price_history(vendor_slug);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendor_scrape_configs' AND column_name = 'last_scraped_at'
  ) THEN
    ALTER TABLE vendor_scrape_configs ADD COLUMN last_scraped_at timestamptz DEFAULT NULL;
  END IF;
END $$;
