/*
  # Increase pg_net timeout for vendor scrape cron job

  ## Problem
  The daily vendor scrape cron job fires HTTP requests via pg_net with the default 5000ms timeout.
  The edge function was using EdgeRuntime.waitUntil() to run scraping in the background, but
  Supabase's edge runtime was killing the background task before it could execute, resulting in
  no scrapes completing since March 30.

  ## Fix
  - The edge function now runs scraping synchronously (no waitUntil), so pg_net must wait for
    the actual scrape to finish before receiving a response.
  - Increase pg_net timeout from 5000ms to 150000ms (150 seconds) to accommodate vendors
    that take longer to scrape (e.g., areef-creation takes ~76 seconds).

  ## Changes
  - Recreates `trigger_weekly_vendor_scrape()` with `timeout_milliseconds => 150000` in all
    net.http_post calls.
*/

CREATE OR REPLACE FUNCTION trigger_weekly_vendor_scrape()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_slug text;
  v_supabase_url text := 'https://japalqxqsviymnnjxpay.supabase.co';
  v_anon_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImphcGFscXhxc3ZpeW1ubmp4cGF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1MjUwNTQsImV4cCI6MjA4OTEwMTA1NH0.HuNqkL_NA7jhDMpuoRXzznbm6sVJ5xeOzqUN3OVRo8g';
BEGIN
  FOR v_slug IN
    SELECT slug FROM vendor_scrape_configs WHERE is_active = true ORDER BY slug
  LOOP
    PERFORM net.http_post(
      url              := v_supabase_url || '/functions/v1/scrape-vendor-prices',
      body             := json_build_object('vendor_slug', v_slug, 'include_fish', true, 'force', true)::text::jsonb,
      headers          := jsonb_build_object(
                            'Content-Type', 'application/json',
                            'Authorization', 'Bearer ' || v_anon_key
                          ),
      timeout_milliseconds := 150000
    );
  END LOOP;

  RAISE NOTICE 'Daily vendor scrape triggered for all active vendors';
END;
$$;
