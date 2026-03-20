
/*
  # Add Gem State Corals Vendor

  1. New Vendor
    - Slug: gem-state-corals
    - Name: Gem State Corals
    - URL: https://gemstatecorals.net
    - Platform: Shopify
    - Coral collections: LPS, SPS, soft corals/misc, frontpage (WYSIWYG), live-auction, rhinos-reef

  2. Notes
    - Idaho-based coral retailer
    - Sells WYSIWYG corals with 15-day health guarantee
    - Non-coral collections (dry goods, equipment, merch) are excluded from coral_collections
*/

INSERT INTO vendor_scrape_configs (
  slug,
  name,
  base_url,
  coral_collections,
  fish_collections,
  is_active,
  platform,
  public_url,
  use_products_endpoint
) VALUES (
  'gem-state-corals',
  'Gem State Corals',
  'https://gemstatecorals.net',
  ARRAY[
    'large-polyp-stony-corals-lps',
    'small-polyp-stony-corals-sps',
    'soft-corals-misc',
    'frontpage',
    'live-auction',
    'rhinos-reef'
  ],
  ARRAY[]::text[],
  true,
  'shopify',
  'https://gemstatecorals.net',
  false
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  base_url = EXCLUDED.base_url,
  coral_collections = EXCLUDED.coral_collections,
  fish_collections = EXCLUDED.fish_collections,
  is_active = EXCLUDED.is_active,
  platform = EXCLUDED.platform,
  public_url = EXCLUDED.public_url,
  use_products_endpoint = EXCLUDED.use_products_endpoint;
