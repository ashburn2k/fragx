
/*
  # Coral Marketplace — Full Schema Migration

  ## Overview
  Extends and replaces the basic starter schema with the full Coral Marketplace schema.
  Drops placeholder tables (bids, corals, transactions) and replaces listings + profiles
  with the full-featured versions. Creates all new tables needed for the app.

  ## Changes
  - Drop placeholder tables: bids, corals, transactions
  - Extend profiles table with role, location, reputation fields
  - Replace listings table with full-featured version
  - Add: coral_species, coral_morphs, badges, user_badges
  - Add: listing_images, listing_tags, price_history
  - Add: have_list, want_list, trade_matches
  - Add: messages, reviews, flags, price_alerts

  ## Security
  RLS enabled on all new tables with appropriate policies.
*/

-- ============================================================
-- ENUMS
-- ============================================================

DO $$ BEGIN
  CREATE TYPE coral_group AS ENUM ('SPS', 'LPS', 'Soft Coral');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE rarity_tier AS ENUM ('Common', 'Uncommon', 'Rare', 'Ultra Rare', 'Grail');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE care_difficulty AS ENUM ('Beginner', 'Intermediate', 'Advanced', 'Expert');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE listing_type AS ENUM ('sale', 'trade', 'both');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE listing_status AS ENUM ('active', 'sold', 'traded', 'expired', 'removed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('hobbyist', 'vendor', 'farm');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE trade_match_status AS ENUM ('pending', 'contacted', 'completed', 'declined');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE message_status AS ENUM ('sent', 'read');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE flag_reason AS ENUM ('fake_listing', 'wrong_price', 'wrong_species', 'spam', 'inappropriate', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- DROP OLD PLACEHOLDER TABLES
-- ============================================================

DROP TABLE IF EXISTS bids CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS corals CASCADE;
DROP TABLE IF EXISTS listings CASCADE;

-- ============================================================
-- EXTEND PROFILES
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS role user_role NOT NULL DEFAULT 'hobbyist',
  ADD COLUMN IF NOT EXISTS location_city text,
  ADD COLUMN IF NOT EXISTS location_state text,
  ADD COLUMN IF NOT EXISTS location_country text DEFAULT 'US',
  ADD COLUMN IF NOT EXISTS latitude numeric(9,6),
  ADD COLUMN IF NOT EXISTS longitude numeric(9,6),
  ADD COLUMN IF NOT EXISTS reputation_score numeric(3,1) NOT NULL DEFAULT 5.0,
  ADD COLUMN IF NOT EXISTS total_reviews integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_sales integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_trades integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT false;

-- ============================================================
-- CORAL SPECIES
-- ============================================================

CREATE TABLE IF NOT EXISTS coral_species (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coral_group coral_group NOT NULL,
  genus text NOT NULL,
  species text NOT NULL,
  common_name text,
  rarity_tier rarity_tier NOT NULL DEFAULT 'Common',
  care_difficulty care_difficulty NOT NULL DEFAULT 'Intermediate',
  light_requirement text,
  flow_requirement text,
  temperature_min numeric(4,1),
  temperature_max numeric(4,1),
  description text,
  rarity_votes_up integer NOT NULL DEFAULT 0,
  rarity_votes_down integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(genus, species)
);

ALTER TABLE coral_species ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view coral species"
  ON coral_species FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can update rarity votes"
  ON coral_species FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- CORAL MORPHS
-- ============================================================

CREATE TABLE IF NOT EXISTS coral_morphs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  species_id uuid NOT NULL REFERENCES coral_species(id) ON DELETE CASCADE,
  morph_name text NOT NULL,
  description text,
  rarity_tier rarity_tier NOT NULL DEFAULT 'Rare',
  is_collector_morph boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE coral_morphs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view coral morphs"
  ON coral_morphs FOR SELECT
  TO anon, authenticated
  USING (true);

-- ============================================================
-- BADGES
-- ============================================================

CREATE TABLE IF NOT EXISTS badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  icon text,
  color text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view badges"
  ON badges FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE TABLE IF NOT EXISTS user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id uuid NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  awarded_at timestamptz DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view user badges"
  ON user_badges FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can receive badges"
  ON user_badges FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- LISTINGS (full version)
-- ============================================================

CREATE TABLE IF NOT EXISTS listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  species_id uuid REFERENCES coral_species(id) ON DELETE SET NULL,
  morph_id uuid REFERENCES coral_morphs(id) ON DELETE SET NULL,
  listing_type listing_type NOT NULL DEFAULT 'sale',
  status listing_status NOT NULL DEFAULT 'active',
  title text NOT NULL,
  description text,
  asking_price numeric(10,2),
  trade_for text,
  frag_size text,
  care_difficulty care_difficulty,
  light_requirement text,
  flow_requirement text,
  is_shipping_available boolean NOT NULL DEFAULT true,
  is_local_pickup boolean NOT NULL DEFAULT true,
  location_city text,
  location_state text,
  views integer NOT NULL DEFAULT 0,
  is_wysiwyg boolean NOT NULL DEFAULT false,
  is_aquacultured boolean NOT NULL DEFAULT false,
  is_beginner_friendly boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active listings"
  ON listings FOR SELECT
  TO anon, authenticated
  USING (status = 'active' OR seller_id = auth.uid());

CREATE POLICY "Authenticated users can create listings"
  ON listings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can update own listings"
  ON listings FOR UPDATE
  TO authenticated
  USING (auth.uid() = seller_id)
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can delete own listings"
  ON listings FOR DELETE
  TO authenticated
  USING (auth.uid() = seller_id);

-- ============================================================
-- LISTING IMAGES
-- ============================================================

CREATE TABLE IF NOT EXISTS listing_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  url text NOT NULL,
  is_primary boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE listing_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view listing images"
  ON listing_images FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Listing owners can add images"
  ON listing_images FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM listings WHERE id = listing_id AND seller_id = auth.uid())
  );

CREATE POLICY "Listing owners can delete images"
  ON listing_images FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM listings WHERE id = listing_id AND seller_id = auth.uid())
  );

-- ============================================================
-- LISTING TAGS
-- ============================================================

CREATE TABLE IF NOT EXISTS listing_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  tag text NOT NULL,
  UNIQUE(listing_id, tag)
);

ALTER TABLE listing_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view listing tags"
  ON listing_tags FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Listing owners can add tags"
  ON listing_tags FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM listings WHERE id = listing_id AND seller_id = auth.uid())
  );

CREATE POLICY "Listing owners can remove tags"
  ON listing_tags FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM listings WHERE id = listing_id AND seller_id = auth.uid())
  );

-- ============================================================
-- PRICE HISTORY
-- ============================================================

CREATE TABLE IF NOT EXISTS price_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  species_id uuid REFERENCES coral_species(id) ON DELETE CASCADE,
  morph_id uuid REFERENCES coral_morphs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id uuid REFERENCES listings(id) ON DELETE SET NULL,
  sale_price numeric(10,2) NOT NULL,
  frag_size text,
  location_state text,
  sold_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view price history"
  ON price_history FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can log sale prices"
  ON price_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- HAVE LIST
-- ============================================================

CREATE TABLE IF NOT EXISTS have_list (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  species_id uuid REFERENCES coral_species(id) ON DELETE CASCADE,
  morph_id uuid REFERENCES coral_morphs(id) ON DELETE CASCADE,
  notes text,
  quantity integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE have_list ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active have lists"
  ON have_list FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Users can add to own have list"
  ON have_list FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own have list"
  ON have_list FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete from own have list"
  ON have_list FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- WANT LIST
-- ============================================================

CREATE TABLE IF NOT EXISTS want_list (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  species_id uuid REFERENCES coral_species(id) ON DELETE CASCADE,
  morph_id uuid REFERENCES coral_morphs(id) ON DELETE CASCADE,
  max_price numeric(10,2),
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE want_list ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active want lists"
  ON want_list FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Users can add to own want list"
  ON want_list FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own want list"
  ON want_list FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete from own want list"
  ON want_list FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- TRADE MATCHES
-- ============================================================

CREATE TABLE IF NOT EXISTS trade_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_b_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_a_have_id uuid REFERENCES have_list(id) ON DELETE CASCADE,
  user_b_have_id uuid REFERENCES have_list(id) ON DELETE CASCADE,
  status trade_match_status NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE trade_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own trade matches"
  ON trade_matches FOR SELECT
  TO authenticated
  USING (auth.uid() = user_a_id OR auth.uid() = user_b_id);

CREATE POLICY "Users can create trade matches"
  ON trade_matches FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_a_id OR auth.uid() = user_b_id);

CREATE POLICY "Participants can update match status"
  ON trade_matches FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_a_id OR auth.uid() = user_b_id)
  WITH CHECK (auth.uid() = user_a_id OR auth.uid() = user_b_id);

-- ============================================================
-- MESSAGES
-- ============================================================

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id uuid REFERENCES listings(id) ON DELETE SET NULL,
  trade_match_id uuid REFERENCES trade_matches(id) ON DELETE SET NULL,
  content text NOT NULL,
  status message_status NOT NULL DEFAULT 'sent',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own messages"
  ON messages FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Authenticated users can send messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Recipients can update message status"
  ON messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = recipient_id);

-- ============================================================
-- REVIEWS
-- ============================================================

CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reviewed_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id uuid REFERENCES listings(id) ON DELETE SET NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  transaction_type listing_type,
  created_at timestamptz DEFAULT now(),
  UNIQUE(reviewer_id, listing_id)
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews"
  ON reviews FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can write reviews"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reviewer_id);

-- ============================================================
-- FLAGS
-- ============================================================

CREATE TABLE IF NOT EXISTS flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flagger_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id uuid REFERENCES listings(id) ON DELETE CASCADE,
  flagged_profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  reason flag_reason NOT NULL,
  notes text,
  is_resolved boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Flaggers can view own flags"
  ON flags FOR SELECT
  TO authenticated
  USING (auth.uid() = flagger_id);

CREATE POLICY "Authenticated users can submit flags"
  ON flags FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = flagger_id);

-- ============================================================
-- PRICE ALERTS
-- ============================================================

CREATE TABLE IF NOT EXISTS price_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  species_id uuid REFERENCES coral_species(id) ON DELETE CASCADE,
  morph_id uuid REFERENCES coral_morphs(id) ON DELETE CASCADE,
  target_price numeric(10,2) NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  triggered_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own price alerts"
  ON price_alerts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create price alerts"
  ON price_alerts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own price alerts"
  ON price_alerts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own price alerts"
  ON price_alerts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_listings_seller ON listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_listings_species ON listings(species_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_created ON listings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_price_history_species ON price_history(species_id);
CREATE INDEX IF NOT EXISTS idx_price_history_morph ON price_history(morph_id);
CREATE INDEX IF NOT EXISTS idx_price_history_sold_at ON price_history(sold_at DESC);
CREATE INDEX IF NOT EXISTS idx_have_list_user ON have_list(user_id);
CREATE INDEX IF NOT EXISTS idx_want_list_user ON want_list(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_coral_species_group ON coral_species(coral_group);
CREATE INDEX IF NOT EXISTS idx_coral_species_genus ON coral_species(genus);
