/*
  # Drop Unused Indexes

  ## Summary
  Removes indexes that have never been used by the query planner.
  Unused indexes waste storage space and add overhead to write operations
  (INSERT, UPDATE, DELETE) without providing any query benefit.

  ## Indexes Dropped

  - idx_profiles_banned_by (public.profiles)
  - idx_listings_seller_id (public.listings)
  - idx_listings_species_id (public.listings)
  - idx_have_list_user_id (public.have_list)
  - idx_price_history_morph_id (public.price_history)
  - idx_price_history_species_id (public.price_history)
  - idx_want_list_user_id (public.want_list)
  - idx_messages_recipient_id (public.messages)
  - idx_messages_sender_id (public.messages)
*/

DROP INDEX IF EXISTS public.idx_profiles_banned_by;
DROP INDEX IF EXISTS public.idx_listings_seller_id;
DROP INDEX IF EXISTS public.idx_listings_species_id;
DROP INDEX IF EXISTS public.idx_have_list_user_id;
DROP INDEX IF EXISTS public.idx_price_history_morph_id;
DROP INDEX IF EXISTS public.idx_price_history_species_id;
DROP INDEX IF EXISTS public.idx_want_list_user_id;
DROP INDEX IF EXISTS public.idx_messages_recipient_id;
DROP INDEX IF EXISTS public.idx_messages_sender_id;
