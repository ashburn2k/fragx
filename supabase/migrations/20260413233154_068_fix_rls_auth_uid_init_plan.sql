/*
  # Fix RLS Auth UID Initialization Plan on panel_designs

  ## Summary
  Rewrites all RLS policies on `panel_designs` to use `(select auth.uid())`
  instead of `auth.uid()`. This prevents Postgres from re-evaluating the
  auth function for every row scanned, significantly improving query performance
  at scale by evaluating it once per statement.

  ## Changes
  - Drop and recreate all 4 policies on panel_designs:
    1. SELECT: Authenticated users can view all panel designs
    2. INSERT: Authenticated users can insert designs with creator_uid
    3. UPDATE: Users can update their own designs
    4. DELETE: Users can delete their own designs
*/

DROP POLICY IF EXISTS "Authenticated users can view all panel designs" ON public.panel_designs;
DROP POLICY IF EXISTS "Authenticated users can insert designs with creator_uid" ON public.panel_designs;
DROP POLICY IF EXISTS "Users can update their own designs" ON public.panel_designs;
DROP POLICY IF EXISTS "Users can delete their own designs" ON public.panel_designs;

CREATE POLICY "Authenticated users can view all panel designs"
  ON public.panel_designs
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can insert designs with creator_uid"
  ON public.panel_designs
  FOR INSERT
  TO authenticated
  WITH CHECK (creator_uid = (select auth.uid()));

CREATE POLICY "Users can update their own designs"
  ON public.panel_designs
  FOR UPDATE
  TO authenticated
  USING (creator_uid = (select auth.uid()))
  WITH CHECK (creator_uid = (select auth.uid()));

CREATE POLICY "Users can delete their own designs"
  ON public.panel_designs
  FOR DELETE
  TO authenticated
  USING (creator_uid = (select auth.uid()));
