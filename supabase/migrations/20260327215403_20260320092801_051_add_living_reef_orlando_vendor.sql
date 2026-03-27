INSERT INTO vendor_scrape_configs (slug, name, base_url, public_url, coral_collections, fish_collections, is_active, platform, use_products_endpoint)
VALUES ('living-reef-orlando', 'Living Reef Orlando', 'https://www.livingreeforlando.com', 'https://www.livingreeforlando.com',
  ARRAY['lps', 'sps', 'soft-coral', 'wysiwyg', 'anemones'], ARRAY[]::text[], true, 'shopify', true)
ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name, base_url=EXCLUDED.base_url, public_url=EXCLUDED.public_url,
  coral_collections=EXCLUDED.coral_collections, platform=EXCLUDED.platform, is_active=EXCLUDED.is_active;
