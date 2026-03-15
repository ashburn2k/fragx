/*
  # Deactivate Non-Shopify Vendors

  ## Overview
  The scraper uses Shopify's collection JSON API (/collections/{slug}/products.json).
  Tidal Gardens runs on Magento, not Shopify, so this endpoint returns 404 and no
  products are ever fetched. Marking them inactive prevents wasted scrape attempts
  and misleading empty results in the UI.

  ## Changes
  - Set `is_active = false` for tidal-gardens (Magento platform, incompatible with scraper)

  ## Notes
  - If Tidal Gardens migrates to Shopify in the future, re-enable with:
    UPDATE vendor_scrape_configs SET is_active = true WHERE slug = 'tidal-gardens';
*/

UPDATE vendor_scrape_configs
SET is_active = false
WHERE slug = 'tidal-gardens';
