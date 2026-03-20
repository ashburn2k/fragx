/*
  # Add corals.com vendor

  1. New Vendor
    - `corals-com`: corals.com (WooCommerce platform)
      - Uses WooCommerce Store API v1 at wp-json/wc/store/v1/products
      - coral_collections contains category slugs to scrape
      - platform set to 'woocommerce'

  2. Notes
    - The WooCommerce Store API is publicly accessible without authentication
    - Products are paginated via per_page/page query params
    - Price is returned in minor currency units (divide by 10^2 for USD)
*/

INSERT INTO vendor_scrape_configs (
  slug,
  name,
  base_url,
  public_url,
  coral_collections,
  fish_collections,
  is_active,
  platform,
  use_products_endpoint
) VALUES (
  'corals-com',
  'Corals.com',
  'https://www.corals.com',
  'https://www.corals.com',
  ARRAY['coral-colonies', 'coral-frags', 'anemones', 'clams'],
  ARRAY[]::text[],
  true,
  'woocommerce',
  true
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  base_url = EXCLUDED.base_url,
  public_url = EXCLUDED.public_url,
  coral_collections = EXCLUDED.coral_collections,
  platform = EXCLUDED.platform,
  is_active = EXCLUDED.is_active;
