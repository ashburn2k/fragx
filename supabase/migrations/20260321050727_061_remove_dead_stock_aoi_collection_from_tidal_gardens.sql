/*
  # Remove dead stock-aoi-zoanthids.html entry from Tidal Gardens

  ## Summary
  Removes the single-product page URL from Tidal Gardens' coral_collections array.

  ## Changes
  - Removes 'stock-aoi-zoanthids.html' from tidal-gardens coral_collections
  - This was a single product detail page (not a collection/category page)
  - The Magento scraper found 0 products from it and skipped it each run
  - The product itself is already covered by the main corals.html catalog scrape

  ## Notes
  - stock-*.html URLs on tidalgardens.com are individual product pages
  - All stock items are accessible via corals.html (the main catalog, 356 items)
  - No data loss; wysiwyg-corals.html (61 WYSIWYG items) remains active
*/

UPDATE vendor_scrape_configs
SET coral_collections = array_remove(coral_collections, 'stock-aoi-zoanthids.html')
WHERE slug = 'tidal-gardens';
