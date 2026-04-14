/*
  # Add Missing Foreign Key Indexes

  ## Summary
  Adds covering indexes for all foreign key columns that were missing indexes,
  which caused suboptimal query performance on JOIN and CASCADE operations.

  ## Tables & Indexes Added

  1. coral_morphs
     - species_id

  2. flags
     - flagged_profile_id
     - flagger_id
     - listing_id

  3. have_list
     - morph_id
     - species_id

  4. listing_images
     - listing_id

  5. listings
     - morph_id

  6. messages
     - listing_id
     - trade_match_id

  7. price_alerts
     - morph_id
     - species_id
     - user_id

  8. price_history
     - listing_id
     - user_id

  9. reviews
     - listing_id
     - reviewed_id

  10. trade_matches
      - user_a_have_id
      - user_a_id
      - user_b_have_id
      - user_b_id

  11. user_badges
      - badge_id

  12. want_list
      - morph_id
      - species_id
*/

CREATE INDEX IF NOT EXISTS idx_coral_morphs_species_id ON public.coral_morphs (species_id);

CREATE INDEX IF NOT EXISTS idx_flags_flagged_profile_id ON public.flags (flagged_profile_id);
CREATE INDEX IF NOT EXISTS idx_flags_flagger_id ON public.flags (flagger_id);
CREATE INDEX IF NOT EXISTS idx_flags_listing_id ON public.flags (listing_id);

CREATE INDEX IF NOT EXISTS idx_have_list_morph_id ON public.have_list (morph_id);
CREATE INDEX IF NOT EXISTS idx_have_list_species_id ON public.have_list (species_id);

CREATE INDEX IF NOT EXISTS idx_listing_images_listing_id ON public.listing_images (listing_id);

CREATE INDEX IF NOT EXISTS idx_listings_morph_id ON public.listings (morph_id);

CREATE INDEX IF NOT EXISTS idx_messages_listing_id ON public.messages (listing_id);
CREATE INDEX IF NOT EXISTS idx_messages_trade_match_id ON public.messages (trade_match_id);

CREATE INDEX IF NOT EXISTS idx_price_alerts_morph_id ON public.price_alerts (morph_id);
CREATE INDEX IF NOT EXISTS idx_price_alerts_species_id ON public.price_alerts (species_id);
CREATE INDEX IF NOT EXISTS idx_price_alerts_user_id ON public.price_alerts (user_id);

CREATE INDEX IF NOT EXISTS idx_price_history_listing_id ON public.price_history (listing_id);
CREATE INDEX IF NOT EXISTS idx_price_history_user_id ON public.price_history (user_id);

CREATE INDEX IF NOT EXISTS idx_reviews_listing_id ON public.reviews (listing_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewed_id ON public.reviews (reviewed_id);

CREATE INDEX IF NOT EXISTS idx_trade_matches_user_a_have_id ON public.trade_matches (user_a_have_id);
CREATE INDEX IF NOT EXISTS idx_trade_matches_user_a_id ON public.trade_matches (user_a_id);
CREATE INDEX IF NOT EXISTS idx_trade_matches_user_b_have_id ON public.trade_matches (user_b_have_id);
CREATE INDEX IF NOT EXISTS idx_trade_matches_user_b_id ON public.trade_matches (user_b_id);

CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON public.user_badges (badge_id);

CREATE INDEX IF NOT EXISTS idx_want_list_morph_id ON public.want_list (morph_id);
CREATE INDEX IF NOT EXISTS idx_want_list_species_id ON public.want_list (species_id);
