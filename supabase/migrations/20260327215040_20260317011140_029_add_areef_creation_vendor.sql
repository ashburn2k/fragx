INSERT INTO vendor_scrape_configs (
  slug, name, base_url, public_url, coral_collections, fish_collections, is_active, use_products_endpoint
)
VALUES (
  'areef-creation', 'A Reef Creation', 'https://areefcreation.com', 'https://areefcreation.com',
  ARRAY['lps', 'sps', 'zoas', 'mushrooms', 'soft-corals-misc', 'wysiwyg', 'mother-colonies', 'anemones'],
  ARRAY['fish'], true, true
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name, base_url = EXCLUDED.base_url, public_url = EXCLUDED.public_url,
  coral_collections = EXCLUDED.coral_collections, fish_collections = EXCLUDED.fish_collections,
  is_active = EXCLUDED.is_active, use_products_endpoint = EXCLUDED.use_products_endpoint;
