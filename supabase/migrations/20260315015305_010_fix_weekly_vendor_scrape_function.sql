/*
  # Fix weekly vendor scrape helper to use net.http_post

  Updates the trigger_weekly_vendor_scrape function to call net.http_post
  (the correct pg_net schema) and reads the Supabase URL / anon key from
  the vault-style app.settings that Supabase auto-populates.
*/

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
  BEGIN
    v_supabase_url := current_setting('app.settings.supabase_url');
  EXCEPTION WHEN OTHERS THEN
    v_supabase_url := NULL;
  END;

  BEGIN
    v_anon_key := current_setting('app.settings.supabase_anon_key');
  EXCEPTION WHEN OTHERS THEN
    v_anon_key := NULL;
  END;

  IF v_supabase_url IS NULL OR v_anon_key IS NULL THEN
    RAISE NOTICE 'Supabase URL or anon key not configured in app.settings — skipping weekly vendor scrape';
    RETURN;
  END IF;

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
