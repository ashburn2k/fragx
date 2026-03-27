DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendor_scrape_configs' AND column_name = 'use_products_endpoint'
  ) THEN
    ALTER TABLE vendor_scrape_configs ADD COLUMN use_products_endpoint boolean DEFAULT true NOT NULL;
  END IF;
END $$;

UPDATE vendor_scrape_configs SET use_products_endpoint = false WHERE slug = 'cherry-corals';
