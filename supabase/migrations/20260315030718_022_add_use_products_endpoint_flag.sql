/*
  # Add use_products_endpoint flag to vendor_scrape_configs

  ## Summary
  Adds a `use_products_endpoint` boolean column to vendor_scrape_configs.

  ## Details
  - Some Shopify stores (e.g., Cherry Corals) cap `/products.json` at ~100 items
    and require collection-based scraping for full coverage.
  - Other stores (e.g., Unique Corals) expose all 400+ products via `/products.json`.
  - Defaults to `true` (existing behavior), but can be set to `false` for stores
    where the products endpoint is incomplete.

  ## Changes
  - `vendor_scrape_configs`: new column `use_products_endpoint boolean DEFAULT true`
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendor_scrape_configs' AND column_name = 'use_products_endpoint'
  ) THEN
    ALTER TABLE vendor_scrape_configs ADD COLUMN use_products_endpoint boolean DEFAULT true NOT NULL;
  END IF;
END $$;

-- Cherry Corals caps /products.json at 100 items; collections expose 269+ products
UPDATE vendor_scrape_configs SET use_products_endpoint = false WHERE slug = 'cherry-corals';
