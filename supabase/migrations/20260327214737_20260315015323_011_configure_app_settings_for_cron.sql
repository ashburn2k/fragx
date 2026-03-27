/*
  # Configure app.settings for pg_cron weekly scrape
*/

CREATE OR REPLACE FUNCTION public.trigger_weekly_vendor_scrape()
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
      url     := v_supabase_url || '/functions/v1/scrape-vendor-prices',
      body    := json_build_object('vendor_slug', v_slug, 'include_fish', true, 'force', true)::text::jsonb,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_anon_key
      )
    );
  END LOOP;

  RAISE NOTICE 'Weekly vendor scrape triggered for all active vendors';
END;
$$;
