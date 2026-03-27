DROP POLICY IF EXISTS "Authenticated users can update rarity votes" ON public.coral_species;

CREATE POLICY "Authenticated users can update rarity votes"
  ON public.coral_species FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL)
  WITH CHECK ((select auth.uid()) IS NOT NULL);
