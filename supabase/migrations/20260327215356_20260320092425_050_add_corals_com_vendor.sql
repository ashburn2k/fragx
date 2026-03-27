INSERT INTO vendor_scrape_configs (slug, name, base_url, public_url, coral_collections, fish_collections, is_active, platform, use_products_endpoint)
VALUES ('corals-com', 'Corals.com', 'https://www.corals.com', 'https://www.corals.com',
  ARRAY['coral-colonies', 'coral-frags', 'anemones', 'clams'], ARRAY[]::text[], true, 'woocommerce', true)
ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name, base_url=EXCLUDED.base_url, public_url=EXCLUDED.public_url,
  coral_collections=EXCLUDED.coral_collections, platform=EXCLUDED.platform, is_active=EXCLUDED.is_active;
