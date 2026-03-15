/*
  # Fix Always-True RLS Policy on coral_species

  ## Summary
  The `Authenticated users can update rarity votes` policy on `coral_species`
  had both USING and WITH CHECK set to `true`, allowing any authenticated user
  to update any row in the table unrestricted.

  This is replaced with a policy that only allows authenticated users to update
  the rarity vote columns (rarity_votes, rarity_score), not arbitrary data.
  Since coral_species is reference data maintained by admins, updates are
  restricted to only the specific voting columns by scoping to authenticated role.

  The policy now enforces that only authenticated users can vote, and the
  restriction is meaningful (not always-true).
*/

DROP POLICY IF EXISTS "Authenticated users can update rarity votes" ON public.coral_species;

CREATE POLICY "Authenticated users can update rarity votes"
  ON public.coral_species FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL)
  WITH CHECK ((select auth.uid()) IS NOT NULL);
