/*
  # Fix Unindexed Foreign Keys and Drop Unused Indexes

  ## Summary
  Addresses two categories of database performance/security issues:

  ## 1. Add Missing Foreign Key Indexes
  The following tables have foreign keys without covering indexes, causing slow lookups
  on JOIN and DELETE operations:

  - `have_list.user_id` → profiles
  - `listings.seller_id` → profiles
  - `listings.species_id` → coral_species
  - `messages.recipient_id` → profiles
  - `messages.sender_id` → profiles
  - `price_history.morph_id` → coral_morphs
  - `price_history.species_id` → coral_species
  - `profiles.banned_by` → profiles
  - `want_list.user_id` → profiles

  ## 2. Drop Unused Indexes
  The following indexes have never been used and only add write overhead:

  - idx_coral_morphs_species_id
  - idx_listings_morph_id
  - idx_user_badges_badge_id
  - idx_listing_images_listing_id
  - idx_have_list_morph_id
  - idx_have_list_species_id
  - idx_price_history_listing_id
  - idx_price_history_user_id
  - idx_want_list_morph_id
  - idx_want_list_species_id
  - idx_trade_matches_user_a_have_id
  - idx_trade_matches_user_a_id
  - idx_trade_matches_user_b_have_id
  - idx_trade_matches_user_b_id
  - idx_messages_listing_id
  - idx_messages_trade_match_id
  - idx_reviews_listing_id
  - idx_reviews_reviewed_id
  - idx_flags_flagged_profile_id
  - idx_flags_flagger_id
  - idx_flags_listing_id
  - idx_price_alerts_morph_id
  - idx_price_alerts_species_id
  - idx_price_alerts_user_id
*/

-- ============================================================
-- Add indexes for unindexed foreign keys
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
-- Drop unused indexes
-- ============================================================

DROP INDEX IF EXISTS public.idx_coral_morphs_species_id;
DROP INDEX IF EXISTS public.idx_listings_morph_id;
DROP INDEX IF EXISTS public.idx_user_badges_badge_id;
DROP INDEX IF EXISTS public.idx_listing_images_listing_id;
DROP INDEX IF EXISTS public.idx_have_list_morph_id;
DROP INDEX IF EXISTS public.idx_have_list_species_id;
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
