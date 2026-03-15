/*
  # Deactivate Reef Raft USA

  ## Overview
  Reef Raft USA (reefraftusa.com) runs on Volusion, an older e-commerce platform
  that does not expose a public product JSON API. The Shopify collection scraper
  is incompatible with Volusion stores.

  ## Changes
  - Set `is_active = false` for reef-raft-usa

  ## Notes
  - Site URL: https://www.reefraftusa.com
  - Platform: Volusion (uses .asp URLs, no /products.json endpoint)
  - To support in the future, a Volusion-specific scraper would be needed
*/

UPDATE vendor_scrape_configs
SET is_active = false
WHERE slug = 'reef-raft-usa';
