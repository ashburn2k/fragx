/*
  # Use leaf-level categories for saltwateraquarium.com

  1. Background
    - Top-level BigCommerce category landing pages on saltwateraquarium.com
      (e.g. /control/, /aquariums/, /lighting/, /filtration/, /chemistry/,
      /flow/) return 404 when fetched from the Supabase Edge Runtime, even
      though they load fine in a browser. Only leaf subcategory pages such
      as /control/aquarium-controllers/ are reachable. The scraper therefore
      cannot auto-discover subcategories from the parent pages.

  2. Changes
    - Replace the parent paths with their leaf subcategories so the scraper
      hits pages it can actually fetch. Parent paths that already returned
      products from Supabase (pumps, water-chemistry, calcium-reactors,
      food, aquascaping) are kept; their subcategories are added too so any
      products only reachable on leaves are still picked up.

  3. Security
    - No RLS or schema changes; data update only.
*/

UPDATE vendor_scrape_configs
SET equipment_collections = ARRAY[
  -- Control & monitoring (parent /control/ 404s from edge)
  'control/aquarium-controllers',
  'control/aquarium-heating',
  'control/automation',
  'control/control-systems',
  'control/cooling',
  'control/hydros-by-coralvue',
  -- Aquariums (parent 404)
  'aquariums/eheim',
  'aquariums/fiji-cube',
  'aquariums/fluval',
  'aquariums/innovative-marine',
  'aquariums/jbj-aquariums',
  'aquariums/nano-tanks',
  'aquariums/pro-clear-aquatic-systems',
  'aquariums/red-sea',
  'aquariums/waterbox',
  -- Lighting (parent 404)
  'lighting/aquaillumination',
  'lighting/aquatic-life',
  'lighting/ati',
  'lighting/current-usa',
  'lighting/ecotech-marine',
  'lighting/ecoxotic',
  'lighting/finnex',
  'lighting/fluval',
  'lighting/illumagic',
  'lighting/kessil',
  'lighting/lifegard',
  'lighting/maxspect',
  'lighting/other-brands',
  'lighting/par-monitors',
  'lighting/red-sea',
  -- Filtration (parent 404)
  'filtration/algae-scrubbers',
  'filtration/filter-media',
  'filtration/filters',
  'filtration/overflows',
  'filtration/plumbing',
  'filtration/protein-skimmers',
  'filtration/reactors',
  'filtration/refugium-sumps',
  'filtration/uv-sterilizers',
  -- Chemistry (parent 404)
  'chemistry/conditioners',
  'chemistry/cycling',
  'chemistry/systems',
  'chemistry/test-kits',
  -- Water movement (replacement for /flow/)
  'water-movement',
  'water-movement/flow-pumps',
  'water-movement/return-pumps',
  'water-movement/auto-top-offs',
  'water-movement/pumps',
  -- Parents that already work, plus their leaves for completeness
  'pumps',
  'pumps/dosing-pumps',
  'pumps/air-pumps',
  'water-chemistry',
  'water-chemistry/additives-supplements',
  'water-chemistry/water-testing',
  'water-chemistry/salt',
  'calcium-reactors',
  'food',
  'food/frozen-foods',
  'food/live-refrigerated',
  'food/live',
  'aquascaping',
  'aquascaping/rock',
  'aquascaping/sand',
  'aquascaping/tools',
  'aquascaping/cement'
]
WHERE slug = 'saltwater-aquarium';
