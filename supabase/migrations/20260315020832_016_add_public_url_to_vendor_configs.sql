/*
  # Add public_url column to vendor_scrape_configs

  1. Changes
    - Add `public_url` column to `vendor_scrape_configs` for displaying the human-facing website URL
    - `base_url` remains the Shopify API endpoint used for scraping
    - Populate `public_url` for all existing vendors

  2. Notes
    - Pacific East Aquaculture uses myshopify.com as base_url for scraping, but pacificeastaquaculture.com as the public site
    - All other vendors already use their public domain as base_url
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendor_scrape_configs' AND column_name = 'public_url'
  ) THEN
    ALTER TABLE vendor_scrape_configs ADD COLUMN public_url text;
  END IF;
END $$;

UPDATE vendor_scrape_configs SET public_url = base_url WHERE public_url IS NULL;
UPDATE vendor_scrape_configs SET public_url = 'https://pacificeastaquaculture.com' WHERE slug = 'pacific-east-aquaculture';
