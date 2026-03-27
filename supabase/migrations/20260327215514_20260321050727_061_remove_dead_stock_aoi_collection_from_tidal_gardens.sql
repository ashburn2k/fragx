UPDATE vendor_scrape_configs
SET coral_collections = array_remove(coral_collections, 'stock-aoi-zoanthids.html')
WHERE slug = 'tidal-gardens';
