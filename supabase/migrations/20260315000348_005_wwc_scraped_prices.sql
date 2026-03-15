/*
  # WWC Scraped Prices Table

  ## Overview
  Stores price data scraped from WorldWideCoral's (WWC) Shopify store via their public JSON API.
  This data supplements community-logged price history with real retail market data.

  ## New Tables

  ### wwc_products
  - `id` (uuid, primary key)
  - `shopify_id` (bigint, unique) - WWC's Shopify product ID for deduplication
  - `handle` (text) - URL slug from Shopify
  - `title` (text) - Full product title e.g. "WWC Blueberry Fields Acropora"
  - `product_type` (text) - e.g. "VP Frags", "Frags", etc.
  - `collection` (text) - Which collection it was scraped from e.g. "acropora"
  - `price` (numeric) - Current listed price in USD
  - `compare_at_price` (numeric, nullable) - Original price if on sale
  - `image_url` (text, nullable) - Primary product image URL
  - `tags` (text[]) - Shopify tags array
  - `description` (text, nullable) - Product description/body_html
  - `scraped_at` (timestamptz) - When this price was recorded
  - `is_available` (boolean) - Whether product is currently listed

  ### wwc_scrape_runs
  - `id` (uuid, primary key)
  - `started_at` (timestamptz) - When scrape began
  - `completed_at` (timestamptz, nullable) - When scrape finished
  - `collections_scraped` (text[]) - Which collections were scraped
  - `products_found` (int) - Total products discovered
  - `products_inserted` (int) - New products added
  - `products_updated` (int) - Existing products updated
  - `status` (text) - 'running', 'completed', 'failed'
  - `error_message` (text, nullable) - Error details if failed

  ## Security
  - RLS enabled on both tables
  - Public read access (price data is publicly available on WWC website)
  - No user write access (only the edge function service role can write)
*/

CREATE TABLE IF NOT EXISTS wwc_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shopify_id bigint UNIQUE NOT NULL,
  handle text NOT NULL,
  title text NOT NULL,
  product_type text DEFAULT '',
  collection text NOT NULL,
  price numeric(10, 2) NOT NULL,
  compare_at_price numeric(10, 2) DEFAULT NULL,
  image_url text DEFAULT NULL,
  tags text[] DEFAULT '{}',
  description text DEFAULT NULL,
  scraped_at timestamptz DEFAULT now(),
  is_available boolean DEFAULT true
);

CREATE TABLE IF NOT EXISTS wwc_scrape_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz DEFAULT NULL,
  collections_scraped text[] DEFAULT '{}',
  products_found int DEFAULT 0,
  products_inserted int DEFAULT 0,
  products_updated int DEFAULT 0,
  status text DEFAULT 'running',
  error_message text DEFAULT NULL
);

ALTER TABLE wwc_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE wwc_scrape_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read wwc products"
  ON wwc_products FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can read wwc scrape runs"
  ON wwc_scrape_runs FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_wwc_products_collection ON wwc_products(collection);
CREATE INDEX IF NOT EXISTS idx_wwc_products_scraped_at ON wwc_products(scraped_at DESC);
CREATE INDEX IF NOT EXISTS idx_wwc_products_price ON wwc_products(price);
CREATE INDEX IF NOT EXISTS idx_wwc_products_title ON wwc_products USING gin(to_tsvector('english', title));
