/*
  # Add WYSIWYG Corals Collection to Tidal Gardens

  ## Summary
  Adds the wysiwyg-corals.html category page to Tidal Gardens' coral_collections.

  ## Changes
  - Updates tidal-gardens vendor_scrape_configs to include the WYSIWYG corals collection
  - This page contains ~61 individual frag/colony listings with photos, separate from the main corals catalog

  ## Notes
  - The main corals.html page covers 356 standard stock items
  - wysiwyg-corals.html has unique "What You See Is What You Get" products with individual photos
  - The Magento scraper deduplicates by shopify_id, so any overlap will be handled automatically
*/

UPDATE vendor_scrape_configs
SET coral_collections = array_append(coral_collections, 'wysiwyg-corals.html')
WHERE slug = 'tidal-gardens'
  AND NOT ('wysiwyg-corals.html' = ANY(coral_collections));
