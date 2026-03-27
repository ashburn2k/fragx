DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendor_products' AND column_name = 'first_seen_at') THEN
    ALTER TABLE vendor_products ADD COLUMN first_seen_at timestamptz DEFAULT now();
    UPDATE vendor_products SET first_seen_at = scraped_at WHERE first_seen_at IS NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendor_scrape_runs' AND column_name = 'products_inserted') THEN
    ALTER TABLE vendor_scrape_runs ADD COLUMN products_inserted integer DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendor_scrape_runs' AND column_name = 'products_updated') THEN
    ALTER TABLE vendor_scrape_runs ADD COLUMN products_updated integer DEFAULT 0;
  END IF;
END $$;
