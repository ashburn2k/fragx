/*
  # Add VenderUp Platform Support

  ## Summary
  Extends the vendor scraping system to support VenderUp stores in addition to Shopify.

  ## Changes

  ### Modified Tables
  - `vendor_scrape_configs`
    - Added `platform` (text, default 'shopify') — identifies the e-commerce platform ('shopify' or 'venderup')
    - Added `venderup_site_link` (text, nullable) — the VenderUp store slug used to query the VenderUp API

  ### New Vendors
  - `coral-exotic` — Coral Exotic on VenderUp (https://shop.venderup.me/coralexotic)

  ## Notes
  - All existing vendors default to platform='shopify', no behavior change
  - VenderUp items use the item link (e.g. 'i-DOBprq9rA') stored in the handle column
  - A stable bigint hash of the item link is used as shopify_id for conflict resolution
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendor_scrape_configs' AND column_name = 'platform'
  ) THEN
    ALTER TABLE vendor_scrape_configs ADD COLUMN platform text NOT NULL DEFAULT 'shopify';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendor_scrape_configs' AND column_name = 'venderup_site_link'
  ) THEN
    ALTER TABLE vendor_scrape_configs ADD COLUMN venderup_site_link text;
  END IF;
END $$;

INSERT INTO vendor_scrape_configs (
  slug, name, base_url, public_url, coral_collections, fish_collections,
  is_active, platform, venderup_site_link, use_products_endpoint
)
VALUES (
  'coral-exotic',
  'Coral Exotic',
  'https://shop.venderup.me/coralexotic',
  'https://shop.venderup.me/coralexotic',
  ARRAY[]::text[],
  ARRAY[]::text[],
  true,
  'venderup',
  'coralexotic',
  false
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  base_url = EXCLUDED.base_url,
  public_url = EXCLUDED.public_url,
  is_active = EXCLUDED.is_active,
  platform = EXCLUDED.platform,
  venderup_site_link = EXCLUDED.venderup_site_link,
  use_products_endpoint = EXCLUDED.use_products_endpoint;
