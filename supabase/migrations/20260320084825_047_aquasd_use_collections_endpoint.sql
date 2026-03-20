/*
  # Switch AquaSD to collection-based scraping

  AquaSD's /products.json endpoint has too many products and causes the edge
  function to time out before completing. AquaSD already has 17 specific coral
  collections defined, so we switch to collection-based scraping which is more
  targeted and bounded.

  ## Changes
  - Set use_products_endpoint = false for aquasd
*/

UPDATE vendor_scrape_configs
SET use_products_endpoint = false
WHERE slug = 'aquasd';
