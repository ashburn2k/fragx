CREATE INDEX IF NOT EXISTS idx_vendor_products_is_available ON vendor_products (is_available);
CREATE INDEX IF NOT EXISTS idx_vendor_products_vendor_slug_is_available ON vendor_products (vendor_slug, is_available);
CREATE INDEX IF NOT EXISTS idx_vendor_products_collection ON vendor_products (collection);
CREATE INDEX IF NOT EXISTS idx_vph_vendor_slug_handle ON vendor_price_history (vendor_slug, handle);
CREATE INDEX IF NOT EXISTS idx_vph_recorded_at ON vendor_price_history (recorded_at DESC);
