/*
  # Add Email Notifications for New Trade Listings

  1. Changes
    - Adds `notify_new_listings` boolean column (default false) to `profiles`
    - Creates `notify_new_have_listing()` trigger function that fires on new have_list inserts
    - The trigger calls the `send-trade-notifications` edge function via pg_net

  2. Behavior
    - When a user adds a new active coral to their Have list, all users with
      `notify_new_listings = true` (except the poster) receive an email notification
    - The pg_net call is async and non-blocking — it will not affect insert performance

  3. Security
    - Trigger function uses SECURITY DEFINER with fixed search_path
    - Only active listings (is_active = true) trigger notifications
*/

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS notify_new_listings boolean DEFAULT false NOT NULL;

CREATE OR REPLACE FUNCTION public.notify_new_have_listing()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_supabase_url text := 'https://zatuaocztzssjrwgqevm.supabase.co';
  v_anon_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InphdHVhb2N6dHpzc2pyd2dxZXZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NDE3ODksImV4cCI6MjA5MDIxNzc4OX0.a3VBLVpLZ1oDh441GD5fXvDuL3bpgkdSSlqCnPe4mWs';
BEGIN
  IF NEW.is_active = true THEN
    PERFORM net.http_post(
      url     := v_supabase_url || '/functions/v1/send-trade-notifications',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_anon_key
      ),
      body    := jsonb_build_object(
        'listing_id',     NEW.id::text,
        'poster_user_id', NEW.user_id::text,
        'coral_type',     COALESCE(NEW.coral_type, ''),
        'notes',          COALESCE(NEW.notes, ''),
        'asking_price',   NEW.asking_price,
        'image_url',      COALESCE(NEW.image_url, '')
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_have_list_insert ON have_list;
CREATE TRIGGER on_have_list_insert
  AFTER INSERT ON have_list
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_have_listing();
