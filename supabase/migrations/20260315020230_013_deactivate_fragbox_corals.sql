/*
  # Deactivate Fragbox Corals

  ## Overview
  Fragbox Corals is listed with the domain fragboxcorals.com which does not resolve.
  Their actual domain is fragbox.ca, but they run WooCommerce (not Shopify), so the
  Shopify collection JSON API scraper is incompatible with their platform.

  ## Changes
  - Set `is_active = false` for fragbox-corals (wrong domain + WooCommerce platform)

  ## Notes
  - Their real site is https://fragbox.ca (WooCommerce/WordPress)
  - To support them in the future, a WooCommerce-compatible scraper would be needed
*/

UPDATE vendor_scrape_configs
SET is_active = false
WHERE slug = 'fragbox-corals';
