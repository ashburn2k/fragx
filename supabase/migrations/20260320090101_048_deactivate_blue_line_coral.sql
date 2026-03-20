/*
  # Deactivate Blue Line Coral vendor

  Deactivates the Blue Line Coral vendor and hides their products from the UI.
*/

UPDATE vendor_scrape_configs
SET is_active = false
WHERE slug = 'blue-line-coral';

UPDATE vendor_products
SET is_available = false
WHERE vendor_slug = 'blue-line-coral';
