/*
  # Add Dust Bowl Corals Vendor

  Adds Dust Bowl Corals (dustbowlcorals.com) to the vendor scrape list.

  - Confirmed Shopify store
  - Coral collections: lps-corals, sps-corals, zoas-softies-anemones
  - No fish collections detected
  - use_products_endpoint = true (standard Shopify /products.json endpoint)
*/

INSERT INTO vendor_scrape_configs
  (slug, name, base_url, public_url, coral_collections, fish_collections, is_active, use_products_endpoint)
VALUES
  (
    'dust-bowl-corals',
    'Dust Bowl Corals',
    'https://dustbowlcorals.com',
    'https://dustbowlcorals.com',
    ARRAY['lps-corals', 'sps-corals', 'zoas-softies-anemones'],
    ARRAY[]::text[],
    true,
    true
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  base_url = EXCLUDED.base_url,
  public_url = EXCLUDED.public_url,
  coral_collections = EXCLUDED.coral_collections,
  fish_collections = EXCLUDED.fish_collections,
  is_active = EXCLUDED.is_active,
  use_products_endpoint = EXCLUDED.use_products_endpoint;
