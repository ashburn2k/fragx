/*
  # Vendor Price Aggregation by Genus

  Creates a view that aggregates vendor_products pricing data by genus name,
  enabling the Price Tracker to show real market prices from scraped vendor data
  rather than relying solely on community-submitted price_history entries.

  1. New Views
    - `vendor_genus_prices` - aggregates avg/min/max/count prices from vendor_products
      grouped by the first word of the product title (genus), with outlier filtering
      (excludes prices below $5 and above $5000 to remove bundles/single polyps noise)

  2. Notes
    - Genus extraction uses INITCAP(split_part(title, ' ', 1)) pattern
    - Only includes is_available = true products
    - Excludes known non-coral collections
*/

CREATE OR REPLACE VIEW vendor_genus_prices AS
SELECT
  INITCAP(SPLIT_PART(TRIM(title), ' ', 1)) AS genus,
  COUNT(*)::int AS product_count,
  ROUND(AVG(price::numeric)::numeric, 2) AS avg_price,
  MIN(price::numeric) AS min_price,
  MAX(price::numeric) AS max_price,
  ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY price::numeric)::numeric, 2) AS median_price
FROM vendor_products
WHERE
  is_available = true
  AND price IS NOT NULL
  AND price::numeric BETWEEN 5 AND 5000
  AND collection NOT IN (
    'dry-goods', 'equipment', 'fish', 'invertebrates', 'supplies',
    'food', 'chemicals', 'lighting', 'pumps', 'filtration',
    'dry goods', 'equipment & supplies'
  )
GROUP BY INITCAP(SPLIT_PART(TRIM(title), ' ', 1))
HAVING COUNT(*) >= 2;
