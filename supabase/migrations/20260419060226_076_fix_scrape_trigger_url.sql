/*
  # Fix Daily Vendor Scrape Trigger URL

  The trigger_weekly_vendor_scrape() function had the old Supabase project URL
  hardcoded (japalqxqsviymnnjxpay), causing all daily cron scrapes to fire
  against the wrong project for the past several days with no data coming in.

  This migration updates both the URL and anon key to match the current
  active Supabase project (zatuaocztzssjrwgqevm).
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
      url     := v_supabase_url || '/functions/v1/scrape-vendor-prices',
      body    := json_build_object('vendor_slug', v_slug, 'include_fish', true, 'force', true)::text::jsonb,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_anon_key
      )
    );
  END LOOP;

  RAISE NOTICE 'Daily vendor scrape triggered for all active vendors';
END;
$$;
