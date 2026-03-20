/*
  # Add coral_type to have_list and want_list

  Replaces the species_id foreign key lookup with a simple free-text
  coral_type field (e.g. "SPS", "LPS", "Soft Coral", "Zoanthids",
  "Mushrooms", "Frag Pack", "Other") so users don't need to pick a
  specific scientific species when posting a trade.

  ## Changes
  - `have_list`: adds `coral_type text` column
  - `want_list`: adds `coral_type text` column

  ## Notes
  - Existing rows keep their species_id (not dropped) for history
  - New inserts will populate coral_type instead of species_id
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'have_list' AND column_name = 'coral_type'
  ) THEN
    ALTER TABLE have_list ADD COLUMN coral_type text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'want_list' AND column_name = 'coral_type'
  ) THEN
    ALTER TABLE want_list ADD COLUMN coral_type text;
  END IF;
END $$;
