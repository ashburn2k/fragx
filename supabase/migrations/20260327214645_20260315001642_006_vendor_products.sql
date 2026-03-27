/*
  # Vendor Products & Scrape Runs
*/

CREATE TABLE IF NOT EXISTS vendor_scrape_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  base_url text NOT NULL,
  coral_collections text[] DEFAULT '{}',
  fish_collections text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vendor_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_slug text NOT NULL,
  shopify_id bigint NOT NULL,
  handle text NOT NULL,
  title text NOT NULL,
  product_type text DEFAULT '',
  collection text NOT NULL,
  price numeric(10,2) NOT NULL,
  compare_at_price numeric(10,2) DEFAULT NULL,
  image_url text DEFAULT NULL,
  tags text[] DEFAULT '{}',
  description text DEFAULT NULL,
  scraped_at timestamptz DEFAULT now(),
  is_available boolean DEFAULT true,
  UNIQUE (vendor_slug, shopify_id)
);

CREATE TABLE IF NOT EXISTS vendor_scrape_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_slug text NOT NULL,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz DEFAULT NULL,
  products_found int DEFAULT 0,
  status text DEFAULT 'running',
  error_message text DEFAULT NULL
);

ALTER TABLE vendor_scrape_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_scrape_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read vendor scrape configs"
  ON vendor_scrape_configs FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can read vendor products"
  ON vendor_products FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can read vendor scrape runs"
  ON vendor_scrape_runs FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_vendor_products_vendor_slug ON vendor_products(vendor_slug);
CREATE INDEX IF NOT EXISTS idx_vendor_products_collection ON vendor_products(collection);
CREATE INDEX IF NOT EXISTS idx_vendor_products_price ON vendor_products(price);
CREATE INDEX IF NOT EXISTS idx_vendor_products_scraped_at ON vendor_products(scraped_at DESC);
CREATE INDEX IF NOT EXISTS idx_vendor_scrape_runs_vendor ON vendor_scrape_runs(vendor_slug, started_at DESC);

INSERT INTO vendor_scrape_configs (slug, name, base_url, coral_collections, fish_collections) VALUES
('unique-corals', 'Unique Corals', 'https://uniquecorals.com',
  ARRAY['acropora','montipora','zoanthids','mushrooms','lps','hammer-corals','torch-corals','chalice-corals','favia','faviidae'],
  ARRAY[]::text[]),
('vivid-aquariums', 'Vivid Aquariums', 'https://vividaquariums.com',
  ARRAY['acropora','montipora','zoanthids','lps-corals','soft-corals','sps-corals'],
  ARRAY['saltwater-fish']),
('battle-corals', 'Battle Corals', 'https://battlecorals.com',
  ARRAY['acropora','montipora','zoanthids','lps','sps'],
  ARRAY[]::text[]),
('tidal-gardens', 'Tidal Gardens', 'https://tidalgardens.com',
  ARRAY['acropora','montipora','zoanthids','lps','sps','soft-corals'],
  ARRAY[]::text[]),
('reef-chasers', 'Reef Chasers', 'https://reefchasers.com',
  ARRAY['zoanthids','palythoa','acropora','montipora','lps'],
  ARRAY[]::text[]),
('cherry-corals', 'Cherry Corals', 'https://cherrycorals.com',
  ARRAY['acropora','montipora','lps','zoanthids','euphyllia'],
  ARRAY[]::text[]),
('cornbred-corals', 'Cornbred Corals', 'https://cornbredcorals.com',
  ARRAY['acropora','montipora','zoanthids','lps'],
  ARRAY[]::text[]),
('fragbox-corals', 'Fragbox Corals', 'https://fragboxcorals.com',
  ARRAY['acropora','montipora','zoanthids','lps','sps'],
  ARRAY[]::text[]),
('reef-raft-usa', 'Reef Raft USA', 'https://reefraftusa.com',
  ARRAY['acropora','montipora','zoanthids','lps'],
  ARRAY[]::text[]),
('pacific-east-aquaculture', 'Pacific East Aquaculture', 'https://pacificeastaquaculture.com',
  ARRAY['acropora','montipora','lps','sps','soft-corals'],
  ARRAY[]::text[])
ON CONFLICT (slug) DO NOTHING;
