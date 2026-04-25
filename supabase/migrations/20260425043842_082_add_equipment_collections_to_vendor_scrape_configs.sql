/*
  # Add equipment_collections to vendor_scrape_configs

  Some vendors (e.g. Bulk Reef Supply) primarily sell equipment, not just live
  goods. The scraper previously only handled `coral_collections` and
  `fish_collections`. This migration adds an `equipment_collections` array so
  vendors can declare equipment category URLs, and seeds Bulk Reef Supply with
  its main equipment categories.

  1. Schema change
    - vendor_scrape_configs.equipment_collections (text[], default '{}')
      Stores the catalog URL paths for equipment listings, scraped the same way
      as coral_collections but products are tagged with product_type='equipment'
      so the frontend classifier routes them to the Equipment tab.

  2. Data change
    - Populate equipment_collections for `bulk-reef-supply` with its main
      shoppable equipment categories.

  3. Security
    - No policy changes; existing RLS on vendor_scrape_configs continues to
      apply.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendor_scrape_configs' AND column_name = 'equipment_collections'
  ) THEN
    ALTER TABLE vendor_scrape_configs
      ADD COLUMN equipment_collections text[] NOT NULL DEFAULT '{}';
  END IF;
END $$;

UPDATE vendor_scrape_configs
SET equipment_collections = ARRAY[
  'aquarium-lighting.html',
  'pumps-plumbing.html',
  'sumps-tanks-refugiums.html',
  'filtration.html',
  'fragging-supplies.html',
  'auto-top-off.html',
  'calcium-reactors.html',
  'protein-skimmers.html',
  'specials/clearance.html'
]
WHERE slug = 'bulk-reef-supply';
