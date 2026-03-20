/*
  # Remove rhinos-reef collection from Gem State Corals

  The rhinos-reef collection contains 3D printed aquarium accessories (frag racks,
  light shades, etc.) from the brand "Rhino's Reef" — not coral products. Removing
  it from the coral scrape config so these non-coral items no longer appear.
*/

UPDATE vendor_scrape_configs
SET coral_collections = array_remove(coral_collections, 'rhinos-reef')
WHERE slug = 'gem-state-corals';
