/*
  # Reactivate Reef Raft USA with Volusion platform support

  ## Overview
  Reef Raft USA (reefraftusa.com) runs on the Volusion e-commerce platform.
  A Volusion-specific HTML scraper has been built into the scrape-vendor-prices
  edge function. This migration reactivates the vendor and configures it correctly.

  ## Changes
  - `vendor_scrape_configs` (reef-raft-usa):
    - Set `platform` = 'volusion'
    - Set `coral_collections` to Volusion category IDs for coral pages
    - Set `base_url` to the correct www URL
    - Set `public_url` for display linking
    - Set `is_active` = true

  ## Notes
  - Category 1872 is "Reef Raft Corals" — the primary live coral listing page
  - Products use string codes (e.g., ABC-109, SIG102) hashed to numeric IDs
  - The scraper fetches /category-s/[ID].htm pages and parses product HTML
*/

UPDATE vendor_scrape_configs
SET
  platform = 'volusion',
  base_url = 'https://www.reefraftusa.com',
  public_url = 'https://www.reefraftusa.com',
  coral_collections = ARRAY['1872'],
  fish_collections = ARRAY[]::text[],
  use_products_endpoint = false,
  is_active = true,
  last_scraped_at = NULL
WHERE slug = 'reef-raft-usa';
