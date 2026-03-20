/*
  # Add composite index for vendor product queries

  ## Summary
  Adds a composite index on (vendor_slug, scraped_at DESC) to the vendor_products table.

  ## Why
  The most frequent query pattern is: filter by vendor_slug, order by scraped_at DESC.
  The separate single-column indexes on vendor_slug and scraped_at cannot be combined
  as efficiently as a single composite index, which the query planner can use for both
  the filter and the sort in a single index scan.

  ## Changes
  - New composite index: idx_vendor_products_slug_scraped on vendor_products(vendor_slug, scraped_at DESC)
*/

CREATE INDEX IF NOT EXISTS idx_vendor_products_slug_scraped
  ON vendor_products(vendor_slug, scraped_at DESC);
