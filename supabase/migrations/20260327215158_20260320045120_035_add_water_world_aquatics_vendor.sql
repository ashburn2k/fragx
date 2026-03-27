INSERT INTO vendor_scrape_configs (slug, name, base_url, public_url, coral_collections, fish_collections, is_active, use_products_endpoint)
VALUES ('water-world-aquatics', 'Water World Aquatics', 'https://waterworldaquatics.us', 'https://waterworldaquatics.us',
  ARRAY['euphyllia', 'hammers', 'lps', 'mushrooms', 'soft-coral', 'sps', 'torches', 'wysiwyg', 'anemones'],
  ARRAY[]::text[], true, true)
ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name, base_url=EXCLUDED.base_url, public_url=EXCLUDED.public_url,
  coral_collections=EXCLUDED.coral_collections, fish_collections=EXCLUDED.fish_collections,
  is_active=EXCLUDED.is_active, use_products_endpoint=EXCLUDED.use_products_endpoint;
