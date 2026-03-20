/*
  # Fix Living Reef Orlando vendor scraping

  ## Problem
  The vendor was configured with use_products_endpoint = true, which fetches ALL products
  from /products.json — including dry goods (equipment, aquariums, skimmers, etc.).
  Their corals are organized in time-based drop collections (2pm-drop-sunday, etc.)
  and standard coral category collections, not via the products endpoint.

  ## Fix
  - Set use_products_endpoint = false so only specified collections are scraped
  - Set coral_collections to include all their coral/aquatic life collection handles:
    - Time-based Sunday drop slots (2pm–7pm)
    - Time-based Saturday drop slots (2pm–7pm, currently empty but included for future use)
    - Standard coral category handles: lps, sps, soft-coral, wysiwyg, anemones, inverts, clownfish

  This ensures only coral/aquatic products are captured, not dry goods.
*/

UPDATE vendor_scrape_configs
SET
  use_products_endpoint = false,
  coral_collections = ARRAY[
    '2pm-drop-sunday',
    '3pm-drop-sunday',
    '4pm-drop-sunday',
    '5pm-drop-sunday',
    '6pm-drop-sunday',
    '7pm-drop-sunday',
    '8pm-drop-sunday',
    '2pm-drop',
    '3pm-drop',
    '4pm-drop',
    '5pm-drop',
    '6pm-drop',
    '7pm-drop',
    'lps',
    'sps',
    'soft-coral',
    'wysiwyg',
    'anemones',
    'inverts',
    'clownfish',
    'collectors-corner'
  ]
WHERE slug = 'living-reef-orlando';
