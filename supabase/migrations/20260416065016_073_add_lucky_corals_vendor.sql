/*
  # Add Lucky Corals Vendor

  Adds Lucky Corals (luckycorals.com) to the vendor scrape list.

  1. New Vendor
    - slug: lucky-corals
    - Platform: Shopify, use_products_endpoint: true
    - Coral collections cover all LPS, SPS, soft coral, and specialty categories
    - No fish collections
*/

INSERT INTO vendor_scrape_configs (
  slug,
  name,
  base_url,
  public_url,
  coral_collections,
  fish_collections,
  platform,
  use_products_endpoint,
  is_active
) VALUES (
  'lucky-corals',
  'Lucky Corals',
  'https://luckycorals.com',
  'https://luckycorals.com',
  ARRAY[
    'corals-for-sale',
    'lps-corals',
    'sps',
    'soft-corals',
    'acan-coral',
    'lps-acanthophyllia',
    'anemone',
    'lps-blasto',
    'bubble-coral',
    'lps-chalice',
    'reef-aquarium-clams-for-sale',
    'lps-cynarina',
    'cyphastrea',
    'lps-duncan',
    'elegance-coral-for-sale',
    'lps-favia',
    'frogspawn-coral',
    'goni-corals',
    'hammer-corals',
    'lps-bowerbanki',
    'lps-leptoseris',
    'lps-lobophyllia-symphyllia',
    'lps-pectinia',
    'sps-montipora',
    'soft-corals-mushroom-corals',
    'all-corals-nps',
    'plate-corals',
    'lps-scolymia',
    'torch-corals'
  ],
  ARRAY[]::text[],
  'shopify',
  true,
  true
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  base_url = EXCLUDED.base_url,
  public_url = EXCLUDED.public_url,
  coral_collections = EXCLUDED.coral_collections,
  fish_collections = EXCLUDED.fish_collections,
  platform = EXCLUDED.platform,
  use_products_endpoint = EXCLUDED.use_products_endpoint,
  is_active = EXCLUDED.is_active;
