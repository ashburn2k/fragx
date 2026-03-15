/*
  # Drop Unused Indexes

  ## Summary
  Removes indexes that have never been used by the query planner.
  These indexes consume storage and slow down write operations without providing
  any query performance benefit.

  ## Indexes Dropped
  - vendor_price_history: idx_vph_vendor_shopify, idx_vph_recorded_at
  - coral_species: idx_coral_species_group
  - listings: idx_listings_seller, idx_listings_species, idx_listings_created
  - price_history: idx_price_history_species, idx_price_history_morph
  - have_list: idx_have_list_user
  - want_list: idx_want_list_user
  - messages: idx_messages_sender, idx_messages_recipient
  - wwc_products: idx_wwc_products_collection, idx_wwc_products_price, idx_wwc_products_title, idx_wwc_products_store_slug
  - vendor_products: idx_vendor_products_collection, idx_vendor_products_price
*/

DROP INDEX IF EXISTS public.idx_vph_vendor_shopify;
DROP INDEX IF EXISTS public.idx_vph_recorded_at;
DROP INDEX IF EXISTS public.idx_coral_species_group;
DROP INDEX IF EXISTS public.idx_listings_seller;
DROP INDEX IF EXISTS public.idx_listings_species;
DROP INDEX IF EXISTS public.idx_listings_created;
DROP INDEX IF EXISTS public.idx_price_history_species;
DROP INDEX IF EXISTS public.idx_price_history_morph;
DROP INDEX IF EXISTS public.idx_have_list_user;
DROP INDEX IF EXISTS public.idx_want_list_user;
DROP INDEX IF EXISTS public.idx_messages_sender;
DROP INDEX IF EXISTS public.idx_messages_recipient;
DROP INDEX IF EXISTS public.idx_wwc_products_collection;
DROP INDEX IF EXISTS public.idx_wwc_products_price;
DROP INDEX IF EXISTS public.idx_wwc_products_title;
DROP INDEX IF EXISTS public.idx_wwc_products_store_slug;
DROP INDEX IF EXISTS public.idx_vendor_products_collection;
DROP INDEX IF EXISTS public.idx_vendor_products_price;
