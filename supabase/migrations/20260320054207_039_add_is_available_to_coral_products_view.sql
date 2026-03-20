/*
  # Update coral_products view to include is_available

  Drops and recreates the coral_products view to add is_available as a
  selectable column, removing it from the WHERE clause so the UI can
  optionally toggle between showing and hiding sold-out items.
  Default behavior (hide sold) is preserved in the application layer.
*/

DROP VIEW IF EXISTS coral_products;

CREATE VIEW coral_products AS
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
  vp.is_available,
  vp.scraped_at,
  (vc.public_url || '/products/' || vp.handle) AS product_url
FROM vendor_products vp
JOIN vendor_scrape_configs vc
  ON vp.vendor_slug = vc.slug
WHERE
  vp.price IS NOT NULL
  AND vp.price > 0
  AND vp.collection = ANY(vc.coral_collections);

GRANT SELECT ON coral_products TO anon, authenticated;
