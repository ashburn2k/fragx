/*
  # Add New Vendors Batch 3

  Adds 5 new Shopify-based coral vendors to the scrape list.

  Note: fishotel.com was excluded (WooCommerce platform, no coral products).
        hightideaquatics.net was excluded (Squarespace platform, not supported).

  ## New Vendors

  1. **NY Aquatic** (nyaquatic.com)
     - Full range: LPS, SPS, soft corals, specific genus collections, frags, WYSIWYG

  2. **Marine Pleasures** (marinepleasures.com)
     - Signature corals, SPS, zoanthids, sale collections

  3. **LiveAquaria** (liveaquaria.com)
     - Large retailer: aquacultured, WYSIWYG, certified captive-grown, LPS, maricultured

  4. **The Biota Group** (shop.thebiotagroup.com)
     - Aquacultured, maricultured, LPS, SPS, soft corals, WYSIWYG

  5. **Violet Aquarium** (violetaquarium.com)
     - Extensive genus-level collections: acans, acropora, euphyllia, zoas, and more
*/

INSERT INTO vendor_scrape_configs (
  slug, name, base_url, public_url,
  coral_collections, fish_collections,
  platform, use_products_endpoint, is_active
) VALUES
(
  'ny-aquatic',
  'NY Aquatic',
  'https://nyaquatic.com',
  'https://nyaquatic.com',
  ARRAY[
    'corals-2',
    'lps',
    'other-lps',
    'sps',
    'softies',
    'other-softies',
    'acantho',
    'euphylias',
    'gonis-alviapora',
    'lobos',
    'plates',
    'scoly',
    'trachy',
    'zoa',
    'mushrooms-1',
    'leathers',
    'blasto',
    'bowerbanki',
    'bubble-coral',
    'chalice',
    'cynarina',
    'duncan',
    'echinata',
    'favia-war-coral',
    'frogspawn',
    'hammer',
    'indophyllia',
    'micromussa-lords',
    'micromussa-lord-frags',
    'platygyra',
    'symphyllia-brain',
    'torch',
    'elegance-anemone',
    'frags',
    'colonies',
    'wysiwyg-coral',
    'beginner-coral',
    'collectors-cove',
    'rare-finds-1'
  ],
  ARRAY[]::text[],
  'shopify',
  false,
  true
),
(
  'marine-pleasures',
  'Marine Pleasures',
  'https://marinepleasures.com',
  'https://marinepleasures.com',
  ARRAY[
    'signature-corals',
    'sps-corals',
    'zoanthids-softies',
    'coral-sale',
    'collectors-items'
  ],
  ARRAY[]::text[],
  'shopify',
  false,
  true
),
(
  'live-aquaria',
  'LiveAquaria',
  'https://www.liveaquaria.com',
  'https://www.liveaquaria.com',
  ARRAY[
    'corals',
    'aquacultured-corals',
    'aquacultured-corals-divers-den-wysiwyg-store',
    'liveaquaria-certified-captive-grown-corals',
    'lps-hard-corals',
    'lps-corals-divers-den-wysiwyg-store',
    'maricultured-corals-divers-den-wysiwyg-store',
    'corals-for-beginners',
    'corals-customer-favorites',
    'corals-popular-value-packs',
    'coral-sale'
  ],
  ARRAY[]::text[],
  'shopify',
  false,
  true
),
(
  'biota-group',
  'The Biota Group',
  'https://shop.thebiotagroup.com',
  'https://shop.thebiotagroup.com',
  ARRAY[
    'corals',
    'cultured',
    'cultured-coral',
    'maricultured-corals',
    'lps',
    'sps',
    'soft-corals',
    'beginner',
    'clams',
    'clams-and-invertebrates',
    'cultured-clams-invertebrates'
  ],
  ARRAY[]::text[],
  'shopify',
  false,
  true
),
(
  'violet-aquarium',
  'Violet Aquarium',
  'https://www.violetaquarium.com',
  'https://www.violetaquarium.com',
  ARRAY[
    'coral',
    'aquaculture',
    'frags-1',
    'corals-on-sale-1',
    'acan',
    'acan-bowebanki',
    'acan-echinata',
    'acan-frags',
    'acan-lordhowensis',
    'acan-micromussa',
    'acan-mother-colonies',
    'acropora',
    'acropora-frags',
    'acropora-mother-colonies',
    'blastomussa',
    'blastomussa-frags',
    'candy-cane',
    'candy-cane-frags',
    'chalice',
    'chalice-frags',
    'cyphastrea',
    'cyphastrea-frags',
    'euphyllia',
    'euphyllia-frag',
    'favia-favites-goniastrea',
    'favia-frags',
    'flowering-pavona',
    'flowering-pavona-frags',
    'fungia',
    'goniopora',
    'gonipora-frags',
    'leptoseris',
    'lobophyllia',
    'lobophyllia-frags',
    'montipora',
    'montipora-frags',
    'pectinia',
    'scolymia',
    'soft-corals',
    'leather-coral-frags',
    'green-star-polyp-misc',
    'green-star-polyp-frags',
    'mushroom',
    'palythoa',
    'zoa',
    'zoa-frags',
    'splash-deal-paly-zoa-frags',
    '10-supersale-frags',
    '20-supersale-corals',
    '30-supersale-frag',
    'fourty-frag',
    'fifty-frags',
    '50-plus-frags'
  ],
  ARRAY[]::text[],
  'shopify',
  false,
  true
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  base_url = EXCLUDED.base_url,
  public_url = EXCLUDED.public_url,
  coral_collections = EXCLUDED.coral_collections,
  fish_collections = EXCLUDED.fish_collections,
  platform = EXCLUDED.platform,
  use_products_endpoint = EXCLUDED.use_products_endpoint,
  is_active = EXCLUDED.is_active;
