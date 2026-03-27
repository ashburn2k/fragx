UPDATE vendor_scrape_configs
SET coral_collections = array_append(coral_collections, 'wysiwyg-corals.html')
WHERE slug = 'tidal-gardens' AND NOT ('wysiwyg-corals.html' = ANY(coral_collections));
