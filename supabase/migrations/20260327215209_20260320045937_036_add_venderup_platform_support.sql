DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendor_scrape_configs' AND column_name = 'platform') THEN
    ALTER TABLE vendor_scrape_configs ADD COLUMN platform text NOT NULL DEFAULT 'shopify';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendor_scrape_configs' AND column_name = 'venderup_site_link') THEN
    ALTER TABLE vendor_scrape_configs ADD COLUMN venderup_site_link text;
  END IF;
END $$;

INSERT INTO vendor_scrape_configs (slug, name, base_url, public_url, coral_collections, fish_collections, is_active, platform, venderup_site_link, use_products_endpoint)
VALUES ('coral-exotic', 'Coral Exotic', 'https://shop.venderup.me/coralexotic', 'https://shop.venderup.me/coralexotic',
  ARRAY[]::text[], ARRAY[]::text[], true, 'venderup', 'coralexotic', false)
ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name, base_url=EXCLUDED.base_url, public_url=EXCLUDED.public_url,
  is_active=EXCLUDED.is_active, platform=EXCLUDED.platform, venderup_site_link=EXCLUDED.venderup_site_link,
  use_products_endpoint=EXCLUDED.use_products_endpoint;
