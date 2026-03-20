/*
  # Add Top Shelf Aquatics Vendor

  1. New Vendor
    - Adds Top Shelf Aquatics (topshelfaquatics.com) as a Shopify-based vendor
    - Uses the `all-corals` collection as the primary coral collection
    - Platform: shopify, use_products_endpoint: true
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
  'top-shelf-aquatics',
  'Top Shelf Aquatics',
  'https://topshelfaquatics.com',
  'https://topshelfaquatics.com',
  ARRAY[
    'all-corals',
    'acropora',
    'acans',
    'acanthophyllia',
    'zoanthids',
    'euphyllia',
    'lps',
    'sps',
    'soft-corals',
    'mushrooms',
    'anemones'
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
  platform = EXCLUDED.platform,
  use_products_endpoint = EXCLUDED.use_products_endpoint,
  is_active = EXCLUDED.is_active;
