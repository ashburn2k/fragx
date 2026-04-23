/*
  # Increase pg_net timeout for vendor scrape cron trigger

  ## Problem
  The daily cron trigger fires all vendor scrapes simultaneously using net.http_post,
  which has a default 5-second timeout. Slow vendors (e.g. cherry-corals with 21
  collections scraped sequentially with 300ms delays) take 8-60+ seconds to complete.
  When pg_net times out and closes the HTTP connection, the edge function's execution
  context is terminated before vendor_price_history records are written, silently
  dropping all history snapshots for those vendors.

  ## Fix
  Increase timeout_milliseconds from the default 5000ms to 120000ms (2 minutes)
  so pg_net waits long enough for slow vendors to respond. Combined with the
  EdgeRuntime.waitUntil fix in the edge function (which returns 200 immediately
  and runs the scrape in the background), this ensures reliable history recording.
*/

CREATE OR REPLACE FUNCTION trigger_weekly_vendor_scrape()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_slug text;
  v_supabase_url text := 'https://zatuaocztzssjrwgqevm.supabase.co';
  v_anon_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InphdHVhb2N6dHpzc2pyd2dxZXZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NDE3ODksImV4cCI6MjA5MDIxNzc4OX0.a3VBLVpLZ1oDh441GD5fXvDuL3bpgkdSSlqCnPe4mWs';
BEGIN
  FOR v_slug IN
    SELECT slug FROM vendor_scrape_configs WHERE is_active = true ORDER BY slug
  LOOP
    PERFORM net.http_post(
      url                  := v_supabase_url || '/functions/v1/scrape-vendor-prices',
      body                 := json_build_object('vendor_slug', v_slug, 'include_fish', true, 'force', true)::text::jsonb,
      headers              := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_anon_key
      ),
      timeout_milliseconds := 120000
    );
  END LOOP;

  RAISE NOTICE 'Daily vendor scrape triggered for all active vendors';
END;
$$;
