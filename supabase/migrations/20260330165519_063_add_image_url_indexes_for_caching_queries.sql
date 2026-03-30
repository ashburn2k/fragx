/*
  # Add image_url indexes for caching pipeline queries

  ## Purpose
  The cache-product-images edge function runs queries that filter rows where
  image_url is not null AND does not start with the Supabase storage prefix.
  These queries were doing full table scans on vendor_products and wwc_products.

  ## Changes

  ### vendor_products
  - Add B-tree index on image_url using text_pattern_ops so LIKE prefix patterns
    (e.g. `image_url LIKE 'https://...storage...%'`) can use the index.
  - Add partial index covering rows where image_url IS NULL and is_available = true,
    which is the exact filter used by the null-image enrichment query.

  ### wwc_products
  - Same image_url index for LIKE prefix filtering.
  - Same partial index for null image enrichment.

  ## Notes
  - All indexes use IF NOT EXISTS for safe re-runs.
  - text_pattern_ops enables prefix LIKE pattern index usage regardless of locale/collation.
*/

CREATE INDEX IF NOT EXISTS idx_vendor_products_image_url_pattern
  ON vendor_products (image_url text_pattern_ops)
  WHERE image_url IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_vendor_products_null_image_available
  ON vendor_products (vendor_slug, id)
  WHERE image_url IS NULL AND is_available = true;

CREATE INDEX IF NOT EXISTS idx_wwc_products_image_url_pattern
  ON wwc_products (image_url text_pattern_ops)
  WHERE image_url IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_wwc_products_null_image_available
  ON wwc_products (id)
  WHERE image_url IS NULL AND is_available = true;
