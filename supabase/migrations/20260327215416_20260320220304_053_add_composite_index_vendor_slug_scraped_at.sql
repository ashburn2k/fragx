CREATE INDEX IF NOT EXISTS idx_vendor_products_slug_scraped ON vendor_products(vendor_slug, scraped_at DESC);
