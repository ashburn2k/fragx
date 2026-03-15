/*
  # Add New Vendor Batch 2

  Adds 7 new Shopify-based coral vendors to the scan list:
  - Reef Pro Store (reefprostore.com)
  - New Wave Aquaria (newwaveaquaria.com)
  - Nemo's Reef (nemosreef.com)
  - Dan's Reef World (dansreefworld.com)
  - Palmetto Reef (palmettoreef.com)
  - Reef Life Aquariums (reeflifeaquariums.com)
  - Blue Line Coral (bluelinecoral.com)

  Notes:
  - Tidal Gardens uses Magento (not Shopify) — skipped, not compatible
  - Aquatic Oasis domain redirects and could not be verified — skipped
  - All new vendors confirmed Shopify via /collections/all/products.json or myshopify.com references
  - use_products_endpoint = true for all new vendors
*/

INSERT INTO vendor_scrape_configs
  (slug, name, base_url, public_url, coral_collections, fish_collections, is_active, use_products_endpoint)
VALUES
  (
    'reef-pro-store',
    'Reef Pro Store',
    'https://reefprostore.com',
    'https://reefprostore.com',
    ARRAY['acropora','blastos','chalice','cyphastrea','favia','goniopora','acans','frag-packs','anemone','clams','auctions'],
    ARRAY['angelfish','anthias','basslet','blennies','butterflyfish','clownfish','dottyback','goby','hawkfish','hogfish','jawfish','conditioned-fish'],
    true,
    true
  ),
  (
    'new-wave-aquaria',
    'New Wave Aquaria',
    'https://newwaveaquaria.com',
    'https://newwaveaquaria.com',
    ARRAY['acans','acropora','anemones','birdsnest','blastos','chalice','euphyllia','favia','goniopora','lps','montipora','mushrooms','sps','softies','zoanthids','wysiwyg'],
    ARRAY['angelfish','anthias','basslets','blennies'],
    true,
    true
  ),
  (
    'nemos-reef',
    'Nemo''s Reef',
    'https://nemosreef.com',
    'https://nemosreef.com',
    ARRAY['acan','blasto','chalice','corals-more','hammer'],
    ARRAY[]::text[],
    true,
    true
  ),
  (
    'dans-reef-world',
    'Dan''s Reef World',
    'https://dansreefworld.com',
    'https://dansreefworld.com',
    ARRAY['all-seacreatures','coral-frag','coral-on-sale','farm-coral-frags','lps-coral','our-coral','soft-coral','sps-coral','wysiwyg-coral'],
    ARRAY['saltwater-fish'],
    true,
    true
  ),
  (
    'palmetto-reef',
    'Palmetto Reef',
    'https://palmettoreef.com',
    'https://palmettoreef.com',
    ARRAY['all-coral','anemone','euphyllia','lps','meat-corls','mushrooms','sps','stock-feags','wysiwyg','zoas-palys'],
    ARRAY[]::text[],
    true,
    true
  ),
  (
    'reef-life-aquariums',
    'Reef Life Aquariums',
    'https://reeflifeaquariums.com',
    'https://reeflifeaquariums.com',
    ARRAY['lps-large-polyp-stony-corals','sps-small-polyp-stony','ora-corals','chalice-echnophyllia-mycedium-oxypora','cyphastrea','micromussa','goniopora','tubipora','new-arrivals','sw-arrivals'],
    ARRAY['anthias','basslets','biota','gobies','hawkfish','jawfish','lionfish','marine-angelfish','marine-eels','marine-puffer','tangs','triggerfish'],
    true,
    true
  ),
  (
    'blue-line-coral',
    'Blue Line Coral',
    'https://bluelinecoral.com',
    'https://bluelinecoral.com',
    ARRAY['aquacultured-sps','sps-corals','lps-corals','aquacultured-corals','acans-and-blastos','chalice','favia','goniopora','zoanthids','mushrooms','euphyllia','maricultured-sps','softies','softie-aquacultured','leather-corals'],
    ARRAY[]::text[],
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
