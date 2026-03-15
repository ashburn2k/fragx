/*
  # Improved Vendor Price Aggregation by Coral Genus

  Replaces the naive first-word extraction with a proper genus-match approach:
  - Joins vendor_products titles against known coral_species genera using ILIKE
  - Also matches common trade names (Hammer, Torch, Frogspawn, Zoa/Zoanthid, etc.)
  - Aggregates avg/min/median/max prices per genus from real scraped vendor data

  This powers the Price Tracker page with real market data instead of showing
  empty community-submitted price_history rows.
*/

CREATE OR REPLACE VIEW vendor_genus_prices AS
WITH excluded_collections AS (
  SELECT unnest(ARRAY[
    'dry-goods','equipment','fish','invertebrates','supplies',
    'food','chemicals','lighting','pumps','filtration',
    'dry goods','equipment & supplies','live-fish','live-rock',
    'aquarium-supplies','testing','medication'
  ]) AS col
),
filtered_products AS (
  SELECT
    vp.title,
    vp.price::numeric AS price
  FROM vendor_products vp
  WHERE
    vp.is_available = true
    AND vp.price IS NOT NULL
    AND vp.price::numeric BETWEEN 5 AND 3000
    AND NOT EXISTS (
      SELECT 1 FROM excluded_collections ec
      WHERE LOWER(vp.collection) = ec.col
    )
),
genus_list AS (
  SELECT DISTINCT genus FROM coral_species
),
matched AS (
  SELECT
    g.genus,
    fp.price
  FROM filtered_products fp
  JOIN genus_list g
    ON fp.title ILIKE '%' || g.genus || '%'

  UNION ALL

  SELECT 'Euphyllia' AS genus, fp.price
  FROM filtered_products fp
  WHERE fp.title ILIKE '%hammer coral%'
     OR fp.title ILIKE '%torch coral%'
     OR fp.title ILIKE '%frogspawn%'

  UNION ALL

  SELECT 'Zoanthus' AS genus, fp.price
  FROM filtered_products fp
  WHERE fp.title ILIKE '%zoanthid%'
     OR fp.title ILIKE '%zoa%'
     OR fp.title ILIKE '%palys%'
     OR fp.title ILIKE '%paly %'

  UNION ALL

  SELECT 'Ricordea' AS genus, fp.price
  FROM filtered_products fp
  WHERE fp.title ILIKE '%ricordea%'
     OR fp.title ILIKE '%florida mushroom%'

  UNION ALL

  SELECT 'Trachyphyllia' AS genus, fp.price
  FROM filtered_products fp
  WHERE fp.title ILIKE '%brain coral%'
     OR fp.title ILIKE '%open brain%'
     OR fp.title ILIKE '%trachyphyllia%'

  UNION ALL

  SELECT 'Acropora' AS genus, fp.price
  FROM filtered_products fp
  WHERE fp.title ILIKE '%acro%'
    AND fp.title NOT ILIKE '%acropora%'
)
SELECT
  genus,
  COUNT(*)::int AS product_count,
  ROUND(AVG(price)::numeric, 2) AS avg_price,
  MIN(price) AS min_price,
  MAX(price) AS max_price,
  ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY price)::numeric, 2) AS median_price
FROM matched
GROUP BY genus
HAVING COUNT(*) >= 3;
