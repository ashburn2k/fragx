-- profiles
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

-- user_badges
DROP POLICY IF EXISTS "Authenticated users can receive badges" ON public.user_badges;
CREATE POLICY "Authenticated users can receive badges"
  ON public.user_badges FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- listings
DROP POLICY IF EXISTS "Anyone can view active listings" ON public.listings;
CREATE POLICY "Anyone can view active listings"
  ON public.listings FOR SELECT
  USING (status = 'active' OR (select auth.uid()) = seller_id);

DROP POLICY IF EXISTS "Authenticated users can create listings" ON public.listings;
CREATE POLICY "Authenticated users can create listings"
  ON public.listings FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = seller_id);

DROP POLICY IF EXISTS "Sellers can update own listings" ON public.listings;
CREATE POLICY "Sellers can update own listings"
  ON public.listings FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = seller_id)
  WITH CHECK ((select auth.uid()) = seller_id);

DROP POLICY IF EXISTS "Sellers can delete own listings" ON public.listings;
CREATE POLICY "Sellers can delete own listings"
  ON public.listings FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = seller_id);

-- listing_images
DROP POLICY IF EXISTS "Listing owners can add images" ON public.listing_images;
CREATE POLICY "Listing owners can add images"
  ON public.listing_images FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.listings
      WHERE id = listing_id AND seller_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Listing owners can delete images" ON public.listing_images;
CREATE POLICY "Listing owners can delete images"
  ON public.listing_images FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.listings
      WHERE id = listing_id AND seller_id = (select auth.uid())
    )
  );

-- listing_tags
DROP POLICY IF EXISTS "Listing owners can add tags" ON public.listing_tags;
CREATE POLICY "Listing owners can add tags"
  ON public.listing_tags FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.listings
      WHERE id = listing_id AND seller_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Listing owners can remove tags" ON public.listing_tags;
CREATE POLICY "Listing owners can remove tags"
  ON public.listing_tags FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.listings
      WHERE id = listing_id AND seller_id = (select auth.uid())
    )
  );

-- price_history
DROP POLICY IF EXISTS "Authenticated users can log sale prices" ON public.price_history;
CREATE POLICY "Authenticated users can log sale prices"
  ON public.price_history FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- have_list
DROP POLICY IF EXISTS "Users can add to own have list" ON public.have_list;
CREATE POLICY "Users can add to own have list"
  ON public.have_list FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own have list" ON public.have_list;
CREATE POLICY "Users can update own have list"
  ON public.have_list FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete from own have list" ON public.have_list;
CREATE POLICY "Users can delete from own have list"
  ON public.have_list FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- want_list
DROP POLICY IF EXISTS "Users can add to own want list" ON public.want_list;
CREATE POLICY "Users can add to own want list"
  ON public.want_list FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own want list" ON public.want_list;
CREATE POLICY "Users can update own want list"
  ON public.want_list FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete from own want list" ON public.want_list;
CREATE POLICY "Users can delete from own want list"
  ON public.want_list FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- trade_matches
DROP POLICY IF EXISTS "Users can view own trade matches" ON public.trade_matches;
CREATE POLICY "Users can view own trade matches"
  ON public.trade_matches FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_a_id OR (select auth.uid()) = user_b_id);

DROP POLICY IF EXISTS "Users can create trade matches" ON public.trade_matches;
CREATE POLICY "Users can create trade matches"
  ON public.trade_matches FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_a_id);

DROP POLICY IF EXISTS "Participants can update match status" ON public.trade_matches;
CREATE POLICY "Participants can update match status"
  ON public.trade_matches FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_a_id OR (select auth.uid()) = user_b_id)
  WITH CHECK ((select auth.uid()) = user_a_id OR (select auth.uid()) = user_b_id);

-- messages
DROP POLICY IF EXISTS "Users can view own messages" ON public.messages;
CREATE POLICY "Users can view own messages"
  ON public.messages FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = sender_id OR (select auth.uid()) = recipient_id);

DROP POLICY IF EXISTS "Authenticated users can send messages" ON public.messages;
CREATE POLICY "Authenticated users can send messages"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = sender_id);

DROP POLICY IF EXISTS "Recipients can update message status" ON public.messages;
CREATE POLICY "Recipients can update message status"
  ON public.messages FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = recipient_id)
  WITH CHECK ((select auth.uid()) = recipient_id);

-- reviews
DROP POLICY IF EXISTS "Authenticated users can write reviews" ON public.reviews;
CREATE POLICY "Authenticated users can write reviews"
  ON public.reviews FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = reviewer_id);

-- flags
DROP POLICY IF EXISTS "Flaggers can view own flags" ON public.flags;
CREATE POLICY "Flaggers can view own flags"
  ON public.flags FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = flagger_id);

DROP POLICY IF EXISTS "Authenticated users can submit flags" ON public.flags;
CREATE POLICY "Authenticated users can submit flags"
  ON public.flags FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = flagger_id);

-- price_alerts
DROP POLICY IF EXISTS "Users can view own price alerts" ON public.price_alerts;
CREATE POLICY "Users can view own price alerts"
  ON public.price_alerts FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can create price alerts" ON public.price_alerts;
CREATE POLICY "Users can create price alerts"
  ON public.price_alerts FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own price alerts" ON public.price_alerts;
CREATE POLICY "Users can update own price alerts"
  ON public.price_alerts FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own price alerts" ON public.price_alerts;
CREATE POLICY "Users can delete own price alerts"
  ON public.price_alerts FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);
