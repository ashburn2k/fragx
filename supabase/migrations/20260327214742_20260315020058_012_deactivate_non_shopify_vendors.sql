/*
  # Deactivate Non-Shopify Vendors
*/

UPDATE vendor_scrape_configs
SET is_active = false
WHERE slug = 'tidal-gardens';
