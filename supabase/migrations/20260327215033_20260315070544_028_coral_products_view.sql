DROP VIEW IF EXISTS public.coral_products;

CREATE VIEW public.coral_products
  WITH (security_invoker = true)
AS
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

GRANT SELECT ON public.coral_products TO anon, authenticated;
