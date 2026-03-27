/*
  # Add World Wide Corals to vendor_scrape_configs
*/

INSERT INTO vendor_scrape_configs (slug, name, base_url, coral_collections, fish_collections, is_active)
VALUES (
  'world-wide-corals',
  'World Wide Corals',
  'https://worldwidecorals.com',
  ARRAY['sps-corals', 'lps-corals', 'soft-corals', 'coral-frags', 'corals', 'acropora', 'chalice-corals', 'euphyllia', 'torches', 'duncan-corals', 'frogspawn', 'hammer-corals', 'anemones'],
  ARRAY['saltwater-fish', 'fish'],
  true
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  base_url = EXCLUDED.base_url,
  coral_collections = EXCLUDED.coral_collections,
  fish_collections = EXCLUDED.fish_collections,
  is_active = true;
