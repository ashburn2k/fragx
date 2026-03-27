DROP INDEX IF EXISTS public.idx_listings_seller_id;
DROP INDEX IF EXISTS public.idx_listings_species_id;
DROP INDEX IF EXISTS public.idx_have_list_user_id;
DROP INDEX IF EXISTS public.idx_want_list_user_id;
DROP INDEX IF EXISTS public.idx_price_history_morph_id;
DROP INDEX IF EXISTS public.idx_price_history_species_id;
DROP INDEX IF EXISTS public.idx_messages_recipient_id;
DROP INDEX IF EXISTS public.idx_messages_sender_id;

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

DROP VIEW IF EXISTS public.coral_products;

CREATE VIEW public.coral_products WITH (security_invoker = true) AS
SELECT
  vp.id, vp.vendor_slug, vc.name AS vendor_name, vp.title, vp.price, vp.compare_at_price,
  vp.image_url, vp.handle, vp.collection, vp.tags, vp.is_available, vp.scraped_at,
  (vc.public_url || '/products/' || vp.handle) AS product_url
FROM vendor_products vp
JOIN vendor_scrape_configs vc ON vp.vendor_slug = vc.slug
WHERE vp.price IS NOT NULL AND vp.price > 0 AND vp.collection = ANY(vc.coral_collections);

GRANT SELECT ON public.coral_products TO anon, authenticated;
