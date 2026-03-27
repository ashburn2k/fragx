INSERT INTO vendor_scrape_configs (slug, name, base_url, public_url, coral_collections, fish_collections, is_active, use_products_endpoint, platform)
VALUES ('tidal-gardens', 'Tidal Gardens', 'https://tidalgardens.com', 'https://tidalgardens.com',
  ARRAY['corals.html'], ARRAY[]::text[], true, false, 'magento')
ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name, base_url=EXCLUDED.base_url, public_url=EXCLUDED.public_url,
  coral_collections=EXCLUDED.coral_collections, fish_collections=EXCLUDED.fish_collections,
  is_active=EXCLUDED.is_active, use_products_endpoint=EXCLUDED.use_products_endpoint, platform=EXCLUDED.platform;
