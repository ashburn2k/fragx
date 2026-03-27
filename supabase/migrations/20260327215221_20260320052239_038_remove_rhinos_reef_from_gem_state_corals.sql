UPDATE vendor_scrape_configs SET coral_collections = array_remove(coral_collections, 'rhinos-reef') WHERE slug = 'gem-state-corals';
