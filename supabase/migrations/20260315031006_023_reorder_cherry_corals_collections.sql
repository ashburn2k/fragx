/*
  # Reorder Cherry Corals coral_collections array

  ## Summary
  Puts specialty collections first so the scraper assigns proper category labels.
  Catch-all collections (fresh-cherries) are moved to the end so they only label
  products that weren't already categorized by a specialty collection.
*/

UPDATE vendor_scrape_configs
SET coral_collections = ARRAY[
  'zoanthids',
  'acropora-frags',
  'montipora-frags',
  'ultra-euphyllia-and-elegance',
  'acanthastrea',
  'blastomussa',
  'chalices',
  'favia',
  'goniopora',
  'mushrooms-and-ricordea',
  'plate-corals',
  'scolymia-and-cynarina',
  'ultra-encrusting-corals',
  'wellsophyllia-and-lobophyllia',
  'anemones',
  'bubble-tip-anemones',
  'ultra-rock-anemones',
  'inverts',
  'auctions',
  'auctions2',
  'fresh-cherries'
]
WHERE slug = 'cherry-corals';
