/*
  # Add Islander Corals Vendor

  Adds Islander Corals (islandercorals.com) to the vendor scrape list.

  1. New Vendor
    - slug: islander-corals
    - Platform: Shopify, use_products_endpoint: true
    - Coral collections cover LPS, SPS, euphyllias, zoanthids, mushrooms, and softies
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
  'islander-corals',
  'Islander Corals',
  'https://islandercorals.com',
  'https://islandercorals.com',
  ARRAY[
    'acans-blastos',
    'meat-corals-acantho-cynarina-wilsoni',
    'chalices',
    'euphellias',
    'favias-other-lps',
    'goniopora',
    'shrooms-and-softies',
    'sps',
    'zoanthids'
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
