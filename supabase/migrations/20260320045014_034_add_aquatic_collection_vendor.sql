/*
  # Add Aquatic Collection Vendor

  Adds Aquatic Collection (aquaticcollection.com) to the vendor scrape list.

  - Confirmed Shopify store
  - Coral collections: corals, lps, sps, softies, wysiwyg, wysiwyg-hall-of-fame
  - Fish collections: angels, anthias, basslets, blennies, butterflies, cardinals,
    clownfish, damsels, eels, filefish, fish, gobies, grouper, hogfish, lionfish,
    parrotfish, pipefish, puffers, rabbitfish, tangs, triggers, trunkfish, wrasses
  - use_products_endpoint = true (standard Shopify /products.json endpoint)
*/

INSERT INTO vendor_scrape_configs
  (slug, name, base_url, public_url, coral_collections, fish_collections, is_active, use_products_endpoint)
VALUES
  (
    'aquatic-collection',
    'Aquatic Collection',
    'https://aquaticcollection.com',
    'https://aquaticcollection.com',
    ARRAY['corals', 'lps', 'sps', 'softies', 'wysiwyg', 'wysiwyg-hall-of-fame'],
    ARRAY['angels', 'anthias', 'basslets', 'blennies', 'butterflies', 'cardinals',
          'clownfish', 'damsels', 'eels', 'filefish', 'fish', 'gobies', 'grouper',
          'hogfish', 'lionfish', 'parrotfish', 'pipefish', 'puffers', 'rabbitfish',
          'tangs', 'triggers', 'trunkfish', 'wrasses'],
    true,
    true
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  base_url = EXCLUDED.base_url,
  public_url = EXCLUDED.public_url,
  coral_collections = EXCLUDED.coral_collections,
  fish_collections = EXCLUDED.fish_collections,
  is_active = EXCLUDED.is_active,
  use_products_endpoint = EXCLUDED.use_products_endpoint;
