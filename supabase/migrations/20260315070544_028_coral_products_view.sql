/*
  # Coral Products View

  Creates a view that joins vendor_products with vendor_scrape_configs to expose
  only coral products (using the coral_collections whitelist per vendor) with
  fully-constructed product URLs for deep-linking to the vendor store.

  Columns:
    - id, vendor_slug, vendor_name, title, price, compare_at_price
    - image_url, handle, collection, tags, scraped_at
    - product_url: constructed as public_url || '/products/' || handle
*/

CREATE OR REPLACE VIEW coral_products AS
SELECT
  vp.id,
  vp.vendor_slug,
  vc.name AS vendor_name,
  vp.title,
  vp.price,
  vp.compare_at_price,
  vp.image_url,
  vp.handle,
  vp.collection,
  vp.tags,
  vp.scraped_at,
  (vc.public_url || '/products/' || vp.handle) AS product_url
FROM vendor_products vp
JOIN vendor_scrape_configs vc
  ON vp.vendor_slug = vc.slug
WHERE
  vp.is_available = true
  AND vp.price IS NOT NULL
  AND vp.price > 0
  AND vp.collection = ANY(vc.coral_collections);

GRANT SELECT ON coral_products TO anon, authenticated;
