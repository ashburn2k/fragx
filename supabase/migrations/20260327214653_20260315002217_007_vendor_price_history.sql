/*
  # Vendor Price History
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
