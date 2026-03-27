DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'have_list' AND column_name = 'asking_price') THEN
    ALTER TABLE have_list ADD COLUMN asking_price numeric DEFAULT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'last_seen_at') THEN
    ALTER TABLE profiles ADD COLUMN last_seen_at timestamptz DEFAULT NULL;
  END IF;
END $$;
