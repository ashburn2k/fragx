
/*
  # Add Performance Indexes

  ## Summary
  Adds missing indexes on the two largest tables to cover common query patterns.

  ## New Indexes

  ### vendor_products (66k rows, 64 MB)
  - `idx_vendor_products_is_available` — filters available products; used on nearly every page load
  - `idx_vendor_products_vendor_slug_is_available` — composite covering the most common pattern:
    available products for a specific vendor
  - `idx_vendor_products_collection` — used when filtering products by collection

  ### vendor_price_history (134k rows, 25 MB)
  - `idx_vph_vendor_slug_handle` — composite covering the price history chart lookup
    (previously only vendor_slug was indexed, requiring a filter scan on handle)
  - `idx_vph_recorded_at` — covers time-range ordering in history queries

  ## Notes
  - All use IF NOT EXISTS for safety
  - VACUUM ANALYZE was run separately on vendor_products to reclaim 3,312 dead rows
*/

CREATE INDEX IF NOT EXISTS idx_vendor_products_is_available
  ON vendor_products (is_available);

CREATE INDEX IF NOT EXISTS idx_vendor_products_vendor_slug_is_available
  ON vendor_products (vendor_slug, is_available);

CREATE INDEX IF NOT EXISTS idx_vendor_products_collection
  ON vendor_products (collection);

CREATE INDEX IF NOT EXISTS idx_vph_vendor_slug_handle
  ON vendor_price_history (vendor_slug, handle);

CREATE INDEX IF NOT EXISTS idx_vph_recorded_at
  ON vendor_price_history (recorded_at DESC);
