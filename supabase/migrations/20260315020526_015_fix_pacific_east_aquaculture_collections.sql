/*
  # Fix Pacific East Aquaculture Collection Handles

  ## Overview
  Pacific East Aquaculture uses non-standard Shopify collection handles.
  The previous handles (acropora, montipora, lps, sps, soft-corals) returned
  empty product arrays because those collections don't exist on their store.

  ## Changes
  - Updated coral_collections for pacific-east-aquaculture to use their
    actual collection handles as discovered from their /collections.json endpoint

  ## Actual Collection Handles
  - amazing-acropora
  - saltwater-coral-for-sale
  - wysiwyg-frags-for-reef-aquariums
  - euphyllia-emporium-1
  - polyps-and-shrooms-for-reef-aquariums
  - blastomussa
*/

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
