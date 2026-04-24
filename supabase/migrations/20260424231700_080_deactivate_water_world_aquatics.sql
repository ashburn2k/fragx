/*
  # Deactivate Water World Aquatics vendor

  Removes Water World Aquatics from the active vendor list while preserving
  all scraped product data in the database. Products will remain queryable
  but the vendor will no longer appear in the vendor selector or be scraped.
*/

UPDATE vendor_scrape_configs
SET is_active = false
WHERE slug = 'water-world-aquatics';
