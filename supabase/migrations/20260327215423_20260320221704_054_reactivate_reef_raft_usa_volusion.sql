UPDATE vendor_scrape_configs
SET platform = 'volusion', base_url = 'https://www.reefraftusa.com', public_url = 'https://www.reefraftusa.com',
  coral_collections = ARRAY['1872'], fish_collections = ARRAY[]::text[],
  use_products_endpoint = false, is_active = true, last_scraped_at = NULL
WHERE slug = 'reef-raft-usa';
