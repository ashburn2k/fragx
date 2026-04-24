/*
  # Add SaltwaterAquarium.com and BulkReefSupply.com vendors

  1. New Vendors
    - `saltwater-aquarium` (SaltwaterAquarium.com)
      - Platform: BigCommerce
      - Coral collections: Our Coral Farm and ACI Aquacultured corals
    - `bulk-reef-supply` (BulkReefSupply.com)
      - Platform: Magento
      - Coral collections: corals/clams/anemones category
      - Fish collections: fish, inverts/clean-up-crew

  2. Notes
    - SaltwaterAquarium.com uses BigCommerce (newly supported platform)
    - BulkReefSupply.com uses Magento (already supported platform)
    - Both set to active and will be scraped on the next scheduled run
*/

INSERT INTO vendor_scrape_configs
  (slug, name, base_url, public_url, platform, coral_collections, fish_collections, is_active, use_products_endpoint)
VALUES
  (
    'saltwater-aquarium',
    'SaltwaterAquarium.com',
    'https://www.saltwateraquarium.com',
    'https://www.saltwateraquarium.com',
    'bigcommerce',
    ARRAY['live/corals/our-coral-farm', 'live/aci-corals'],
    ARRAY[]::text[],
    true,
    false
  ),
  (
    'bulk-reef-supply',
    'Bulk Reef Supply',
    'https://www.bulkreefsupply.com',
    'https://www.bulkreefsupply.com',
    'magento',
    ARRAY['live-goods/corals.html'],
    ARRAY['live-goods/fish.html', 'live-goods/inverts-clean-up-crew.html'],
    true,
    false
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  base_url = EXCLUDED.base_url,
  public_url = EXCLUDED.public_url,
  platform = EXCLUDED.platform,
  coral_collections = EXCLUDED.coral_collections,
  fish_collections = EXCLUDED.fish_collections,
  is_active = EXCLUDED.is_active;
