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
