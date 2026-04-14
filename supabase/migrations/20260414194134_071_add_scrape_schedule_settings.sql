/*
  # Add Scrape Schedule Settings

  ## Summary
  Adds infrastructure for admins to configure the daily vendor price scrape schedule
  from the admin panel without needing direct database access.

  ## New Tables
  - `app_settings` — Key-value store for platform-level configuration
    - `key` (text, primary key) — Setting identifier
    - `value` (text) — Setting value
    - `updated_at` (timestamptz) — Last modification timestamp

  ## New Functions
  - `admin_update_scrape_schedule(p_hour int, p_minute int)` — SECURITY DEFINER RPC
    callable by authenticated users; validates admin role internally, then reschedules
    the pg_cron daily scrape job and persists the new time to app_settings.

  ## Security
  - RLS enabled on app_settings
  - SELECT policy: any authenticated user (schedule time is non-sensitive)
  - INSERT/UPDATE done exclusively through the SECURITY DEFINER function (no direct write policies)
  - Function validates admin role via profiles.role before executing

  ## Notes
  1. Seeds initial value '0 2 * * *' (2:00 AM UTC) matching the existing cron job
  2. Function handles missing cron job gracefully (unschedule inside exception block)
*/

CREATE TABLE IF NOT EXISTS app_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read app settings"
  ON app_settings FOR SELECT
  TO authenticated
  USING (true);

INSERT INTO app_settings (key, value)
VALUES ('scrape_schedule_cron', '0 2 * * *')
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION admin_update_scrape_schedule(p_hour int, p_minute int)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, cron
AS $$
DECLARE
  v_cron_expr text;
  v_role text;
BEGIN
  SELECT role INTO v_role FROM profiles WHERE id = auth.uid();
  IF v_role IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Unauthorized: admin role required';
  END IF;

  IF p_hour < 0 OR p_hour > 23 THEN
    RAISE EXCEPTION 'Invalid hour: must be between 0 and 23';
  END IF;
  IF p_minute < 0 OR p_minute > 59 THEN
    RAISE EXCEPTION 'Invalid minute: must be between 0 and 59';
  END IF;

  v_cron_expr := p_minute || ' ' || p_hour || ' * * *';

  BEGIN
    PERFORM cron.unschedule('daily-vendor-price-scrape');
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  PERFORM cron.schedule(
    'daily-vendor-price-scrape',
    v_cron_expr,
    'SELECT trigger_weekly_vendor_scrape();'
  );

  INSERT INTO app_settings (key, value, updated_at)
  VALUES ('scrape_schedule_cron', v_cron_expr, now())
  ON CONFLICT (key) DO UPDATE
    SET value = EXCLUDED.value,
        updated_at = EXCLUDED.updated_at;

  RETURN jsonb_build_object('success', true, 'cron', v_cron_expr);
END;
$$;

GRANT EXECUTE ON FUNCTION admin_update_scrape_schedule(int, int) TO authenticated;
