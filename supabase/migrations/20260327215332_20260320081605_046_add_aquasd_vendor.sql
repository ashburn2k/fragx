INSERT INTO vendor_scrape_configs (slug, name, base_url, public_url, coral_collections, fish_collections, platform, use_products_endpoint, is_active)
VALUES ('aquasd', 'AquaSD', 'https://aquasd.com', 'https://aquasd.com',
  ARRAY['corals','acro-frags','acan-frags','zoa-frags','mushrooms','euphyllias','blastos','chalice-frags','favia-frags','gonis','coral-colonies','elegances','fungia-plate','anemones','asd-treasure-vault','high-end-wysiwyg','almost-wysiwyg'],
  ARRAY[]::text[], 'shopify', true, true)
ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name, base_url=EXCLUDED.base_url, public_url=EXCLUDED.public_url,
  coral_collections=EXCLUDED.coral_collections, platform=EXCLUDED.platform,
  use_products_endpoint=EXCLUDED.use_products_endpoint, is_active=EXCLUDED.is_active;
