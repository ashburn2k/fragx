/*
  # Add equipment brand pages for Bulk Reef Supply

  1. Changes
    - Bulk Reef Supply does not expose a top-level "controllers" or
      "monitoring" category page; brand landing pages (e.g. Neptune Systems,
      EcoTech Marine) are the canonical place these products live. Add the
      major equipment-brand pages so items like the Apex A3 Pro Controller
      get picked up on the next scrape.

  2. Security
    - No RLS or schema changes; data update only.
*/

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
  'specials/clearance.html',
  'brands/neptune-systems.html',
  'brands/ecotech-marine.html',
  'brands/kessil.html',
  'brands/aqua-illumination.html',
  'brands/maxspect.html',
  'brands/tunze.html',
  'brands/reef-octopus.html',
  'brands/innovative-marine.html',
  'brands/red-sea.html',
  'brands/coralvue.html'
]
WHERE slug = 'bulk-reef-supply';
