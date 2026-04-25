/*
  # Reclassify saltwater-aquarium "specialty" paths as live stock

  1. Changes
    - The `saltwater-specialty` and `specialty` BigCommerce categories on
      saltwateraquarium.com hold live invertebrates (cleanup crew, snails,
      shrimp, hermit crabs, etc.) — not equipment. Move them out of
      `equipment_collections` and into `fish_collections` so the scraper
      stops tagging those products with `product_type = 'equipment'`.
    - Backfill existing rows in those collections so they are no longer
      categorized as equipment in the UI.

  2. Security
    - No RLS or schema changes; data update only.
*/

UPDATE vendor_scrape_configs
SET
  equipment_collections = ARRAY[
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
    'aquascaping'
  ],
  fish_collections = ARRAY['saltwater-specialty', 'specialty']
WHERE slug = 'saltwater-aquarium';

UPDATE vendor_products
SET product_type = collection
WHERE vendor_slug = 'saltwater-aquarium'
  AND collection IN ('saltwater-specialty', 'specialty')
  AND product_type = 'equipment';
