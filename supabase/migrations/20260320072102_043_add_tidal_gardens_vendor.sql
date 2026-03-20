/*
  # Add Tidal Gardens Vendor

  Adds Tidal Gardens to the vendor scrape configs.

  ## New Vendors
  - `tidal-gardens` (tidalgardens.com) — Magento platform
    - Uses custom Magento HTML scraping (not Shopify)
    - platform = 'magento'
    - coral_collections stores the catalog page paths to scrape
    - use_products_endpoint = false (not a Shopify endpoint)

  ## Notes
  - Tidal Gardens runs on Magento, not Shopify
  - The scraper fetches category HTML pages and extracts product data
    from the GA4 dataLayer JSON embedded in each page
  - ~366 products in the coral catalog, paginated at 96 per page
*/

INSERT INTO vendor_scrape_configs
  (slug, name, base_url, public_url, coral_collections, fish_collections, is_active, use_products_endpoint, platform)
VALUES
  (
    'tidal-gardens',
    'Tidal Gardens',
    'https://tidalgardens.com',
    'https://tidalgardens.com',
    ARRAY['corals.html'],
    ARRAY[]::text[],
    true,
    false,
    'magento'
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  base_url = EXCLUDED.base_url,
  public_url = EXCLUDED.public_url,
  coral_collections = EXCLUDED.coral_collections,
  fish_collections = EXCLUDED.fish_collections,
  is_active = EXCLUDED.is_active,
  use_products_endpoint = EXCLUDED.use_products_endpoint,
  platform = EXCLUDED.platform;
