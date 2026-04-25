/*
  # Add equipment collections to SaltwaterAquarium.com vendor

  1. Changes
    - Populates `equipment_collections` for the `saltwater-aquarium` vendor
      so that the BigCommerce scraper picks up its full equipment catalog
      (aquariums, lighting, filtration, flow, pumps, controllers, reactors,
      chemistry, food, salt mix and similar top-level categories).

  2. Security
    - No RLS or schema changes; pure data update.
*/

UPDATE vendor_scrape_configs
SET equipment_collections = ARRAY[
  'aquariums',
  'lighting',
  'filtration',
  'flow',
  'pumps',
  'control',
  'calcium-reactors',
  'chemistry',
  'water-chemistry',
  'food',
  'aquascaping',
  'specialty',
  'saltwater-specialty'
]
WHERE slug = 'saltwater-aquarium';
