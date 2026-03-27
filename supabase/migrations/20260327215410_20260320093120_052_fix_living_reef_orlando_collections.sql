UPDATE vendor_scrape_configs
SET use_products_endpoint = false,
  coral_collections = ARRAY['2pm-drop-sunday','3pm-drop-sunday','4pm-drop-sunday','5pm-drop-sunday','6pm-drop-sunday','7pm-drop-sunday','8pm-drop-sunday','2pm-drop','3pm-drop','4pm-drop','5pm-drop','6pm-drop','7pm-drop','lps','sps','soft-coral','wysiwyg','anemones','inverts','clownfish','collectors-corner']
WHERE slug = 'living-reef-orlando';
