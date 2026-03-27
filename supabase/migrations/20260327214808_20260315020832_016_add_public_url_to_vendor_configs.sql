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
