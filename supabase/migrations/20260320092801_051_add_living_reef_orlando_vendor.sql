/*
  # Add Living Reef Orlando vendor

  1. New Vendor
    - `living-reef-orlando`: Living Reef Orlando (Shopify platform)
      - Uses products endpoint to scrape all products at once
      - Organizes corals via time-based drop collections (not standard category handles)
      - platform set to 'shopify'

  2. Notes
    - The store uses time-slot drop collections (2pm-drop-sunday, 3pm-drop-sunday, etc.)
      rather than standard coral category collections
    - Using use_products_endpoint = true captures all available products in one pass
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
  'living-reef-orlando',
  'Living Reef Orlando',
  'https://www.livingreeforlando.com',
  'https://www.livingreeforlando.com',
  ARRAY['lps', 'sps', 'soft-coral', 'wysiwyg', 'anemones'],
  ARRAY[]::text[],
  true,
  'shopify',
  true
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  base_url = EXCLUDED.base_url,
  public_url = EXCLUDED.public_url,
  coral_collections = EXCLUDED.coral_collections,
  platform = EXCLUDED.platform,
  is_active = EXCLUDED.is_active;
