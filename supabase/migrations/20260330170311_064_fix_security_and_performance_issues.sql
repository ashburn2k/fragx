/*
  # Fix Security and Performance Issues

  ## Summary
  This migration addresses all outstanding security advisories and performance warnings.

  ## 1. Add missing FK indexes (9 indexes)
  Covering indexes for foreign key columns that were missing, preventing slow sequential
  scans during JOIN and DELETE cascade operations on:
  - have_list(user_id)
  - listings(seller_id), listings(species_id)
  - messages(recipient_id), messages(sender_id)
  - price_history(morph_id), price_history(species_id)
  - profiles(banned_by)
  - want_list(user_id)

  ## 2. Fix RLS initialization plan on vendor_scrape_configs
  The "Admins can update vendor configs" policy called auth.uid() inline, causing
  Postgres to re-evaluate it for every row. Replaced with (select auth.uid()) so the
  value is computed once per statement.

  ## 3. Drop unused indexes (33 indexes)
  Indexes that have never been used according to pg_stat_user_indexes. Unused indexes
  waste storage and slow down writes with no query benefit.

  ## 4. Fix Security Definer view
  Recreate vendor_genus_prices as SECURITY INVOKER so it executes under the calling
  user's permissions rather than the view owner's, preventing privilege escalation.
*/

-- ============================================================
-- 1. ADD MISSING FK INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_have_list_user_id
  ON public.have_list (user_id);

CREATE INDEX IF NOT EXISTS idx_listings_seller_id
  ON public.listings (seller_id);

CREATE INDEX IF NOT EXISTS idx_listings_species_id
  ON public.listings (species_id);

CREATE INDEX IF NOT EXISTS idx_messages_recipient_id
  ON public.messages (recipient_id);

CREATE INDEX IF NOT EXISTS idx_messages_sender_id
  ON public.messages (sender_id);

CREATE INDEX IF NOT EXISTS idx_price_history_morph_id
  ON public.price_history (morph_id);

CREATE INDEX IF NOT EXISTS idx_price_history_species_id
  ON public.price_history (species_id);

CREATE INDEX IF NOT EXISTS idx_profiles_banned_by
  ON public.profiles (banned_by);

CREATE INDEX IF NOT EXISTS idx_want_list_user_id
  ON public.want_list (user_id);

-- ============================================================
-- 2. FIX RLS INITIALIZATION PLAN
-- ============================================================

DROP POLICY IF EXISTS "Admins can update vendor configs" ON public.vendor_scrape_configs;

CREATE POLICY "Admins can update vendor configs"
  ON public.vendor_scrape_configs FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

-- ============================================================
-- 3. DROP UNUSED INDEXES
-- ============================================================

DROP INDEX IF EXISTS public.idx_profiles_is_banned;
DROP INDEX IF EXISTS public.idx_coral_species_genus;
DROP INDEX IF EXISTS public.idx_coral_morphs_species_id;
DROP INDEX IF EXISTS public.idx_listings_status;
DROP INDEX IF EXISTS public.idx_listings_morph_id;
DROP INDEX IF EXISTS public.idx_user_badges_badge_id;
DROP INDEX IF EXISTS public.idx_listing_images_listing_id;
DROP INDEX IF EXISTS public.idx_have_list_morph_id;
DROP INDEX IF EXISTS public.idx_have_list_species_id;
DROP INDEX IF EXISTS public.idx_price_history_sold_at;
DROP INDEX IF EXISTS public.idx_price_history_listing_id;
DROP INDEX IF EXISTS public.idx_price_history_user_id;
DROP INDEX IF EXISTS public.idx_want_list_morph_id;
DROP INDEX IF EXISTS public.idx_want_list_species_id;
DROP INDEX IF EXISTS public.idx_trade_matches_user_a_have_id;
DROP INDEX IF EXISTS public.idx_trade_matches_user_a_id;
DROP INDEX IF EXISTS public.idx_trade_matches_user_b_have_id;
DROP INDEX IF EXISTS public.idx_trade_matches_user_b_id;
DROP INDEX IF EXISTS public.idx_messages_listing_id;
DROP INDEX IF EXISTS public.idx_messages_trade_match_id;
DROP INDEX IF EXISTS public.idx_reviews_listing_id;
DROP INDEX IF EXISTS public.idx_reviews_reviewed_id;
DROP INDEX IF EXISTS public.idx_flags_flagged_profile_id;
DROP INDEX IF EXISTS public.idx_flags_flagger_id;
DROP INDEX IF EXISTS public.idx_flags_listing_id;
DROP INDEX IF EXISTS public.idx_price_alerts_morph_id;
DROP INDEX IF EXISTS public.idx_price_alerts_species_id;
DROP INDEX IF EXISTS public.idx_price_alerts_user_id;
DROP INDEX IF EXISTS public.idx_wwc_products_scraped_at;
DROP INDEX IF EXISTS public.idx_wwc_products_image_url_pattern;
DROP INDEX IF EXISTS public.idx_wwc_products_null_image_available;
DROP INDEX IF EXISTS public.idx_vendor_products_null_image_available;
DROP INDEX IF EXISTS public.idx_vph_vendor_slug_handle;

-- ============================================================
-- 4. FIX SECURITY DEFINER VIEW
-- Recreate vendor_genus_prices without SECURITY DEFINER
-- (default is SECURITY INVOKER)
-- ============================================================

DROP VIEW IF EXISTS public.vendor_genus_prices;

CREATE VIEW public.vendor_genus_prices
  WITH (security_invoker = true)
AS
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

GRANT SELECT ON public.vendor_genus_prices TO authenticated, anon;
