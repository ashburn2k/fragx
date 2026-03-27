DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'is_locked') THEN
    ALTER TABLE listings ADD COLUMN is_locked boolean NOT NULL DEFAULT false;
  END IF;
END $$;
