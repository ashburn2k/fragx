/*
  # Add Scrape Report Tracking Columns

  1. Changes to `vendor_products`
    - `first_seen_at` (timestamptz) - tracks when a product first appeared in the catalog
      Existing rows receive the value of their current `scraped_at` column.

  2. Changes to `vendor_scrape_runs`
    - `products_inserted` (int) - count of brand-new products discovered this run
    - `products_updated` (int) - count of existing products with price/data changes

  3. Notes
    - `first_seen_at` is set on INSERT and never updated by subsequent upserts.
    - Existing `vendor_scrape_runs` rows default to 0 for the new columns.
    - No RLS changes needed; existing policies cover these new columns automatically.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendor_products' AND column_name = 'first_seen_at'
  ) THEN
    ALTER TABLE vendor_products ADD COLUMN first_seen_at timestamptz DEFAULT now();
    UPDATE vendor_products SET first_seen_at = scraped_at WHERE first_seen_at IS NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendor_scrape_runs' AND column_name = 'products_inserted'
  ) THEN
    ALTER TABLE vendor_scrape_runs ADD COLUMN products_inserted integer DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendor_scrape_runs' AND column_name = 'products_updated'
  ) THEN
    ALTER TABLE vendor_scrape_runs ADD COLUMN products_updated integer DEFAULT 0;
  END IF;
END $$;
