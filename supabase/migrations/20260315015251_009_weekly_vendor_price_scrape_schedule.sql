/*
  # Weekly Vendor Price Auto-Scrape Schedule

  Sets up a pg_cron job that automatically triggers the scrape-vendor-prices
  edge function once per week (every Monday at 2:00 AM UTC) for every active
  vendor. Uses pg_net to make the HTTP call to the edge function.

  Changes:
  1. Enables pg_cron extension
  2. Enables pg_net extension
  3. Creates a helper function that iterates over active vendors and fires
     an async HTTP POST to the scrape-vendor-prices edge function for each one
  4. Schedules that function to run every Monday at 02:00 UTC
*/

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION trigger_weekly_vendor_scrape()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_slug text;
  v_supabase_url text;
  v_anon_key text;
BEGIN
  v_supabase_url := current_setting('app.settings.supabase_url', true);
  v_anon_key     := current_setting('app.settings.supabase_anon_key', true);

  IF v_supabase_url IS NULL OR v_anon_key IS NULL THEN
    RAISE NOTICE 'app.settings.supabase_url or app.settings.supabase_anon_key not set — skipping weekly scrape';
    RETURN;
  END IF;

  FOR v_slug IN
    SELECT slug FROM vendor_scrape_configs WHERE is_active = true
  LOOP
    PERFORM extensions.http_post(
      v_supabase_url || '/functions/v1/scrape-vendor-prices',
      json_build_object('vendor_slug', v_slug, 'include_fish', true, 'force', true)::text,
      'application/json',
      ARRAY[
        extensions.http_header('Authorization', 'Bearer ' || v_anon_key)
      ]
    );
  END LOOP;
END;
$$;

SELECT cron.unschedule('weekly-vendor-price-scrape')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'weekly-vendor-price-scrape'
);

SELECT cron.schedule(
  'weekly-vendor-price-scrape',
  '0 2 * * 1',
  $$ SELECT trigger_weekly_vendor_scrape(); $$
);
