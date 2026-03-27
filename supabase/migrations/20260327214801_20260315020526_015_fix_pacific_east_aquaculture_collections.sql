UPDATE vendor_scrape_configs
SET coral_collections = ARRAY[
  'amazing-acropora',
  'saltwater-coral-for-sale',
  'wysiwyg-frags-for-reef-aquariums',
  'euphyllia-emporium-1',
  'polyps-and-shrooms-for-reef-aquariums',
  'blastomussa'
]
WHERE slug = 'pacific-east-aquaculture';
