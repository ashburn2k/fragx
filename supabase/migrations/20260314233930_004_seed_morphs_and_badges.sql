
/*
  # Seed Coral Morphs and Badges

  ## Overview
  Seeds all named collector morphs tied to their parent species.
  Also seeds the badge definitions used in the trust/reputation system.

  ## Morphs
  - Torch Coral named morphs (5)
  - Zoanthid collector morphs (10)

  ## Badges
  - Trusted Seller
  - Frequent Trader
  - Rare Holder
  - Grail Collector
  - Coral Farm
  - Verified Vendor
  - Community Contributor
  - Price Tracker Pro
*/

-- ============================================================
-- TORCH CORAL MORPHS
-- ============================================================

INSERT INTO coral_morphs (species_id, morph_name, description, rarity_tier, is_collector_morph)
SELECT
  cs.id,
  m.morph_name,
  m.description,
  m.rarity_tier::rarity_tier,
  true
FROM coral_species cs
JOIN (VALUES
  ('Indo Torch', 'Classic Indonesian Torch Coral with gold tips', 'Common'),
  ('Gold Torch', 'Premium gold-tipped Torch Coral with bright yellow tentacle tips', 'Rare'),
  ('Purple Tip Torch', 'Torch Coral with vivid purple tentacle tips', 'Rare'),
  ('Dragon Soul Torch', 'Ultra-rare Torch with metallic dragon scale coloration', 'Ultra Rare'),
  ('Aquaman Torch', 'Premium collector morph with teal and gold striping', 'Grail')
) AS m(morph_name, description, rarity_tier)
ON cs.genus = 'Euphyllia' AND cs.species = 'glabrescens'
ON CONFLICT DO NOTHING;

-- ============================================================
-- ZOANTHID COLLECTOR MORPHS
-- ============================================================

INSERT INTO coral_morphs (species_id, morph_name, description, rarity_tier, is_collector_morph)
SELECT
  cs.id,
  m.morph_name,
  m.description,
  m.rarity_tier::rarity_tier,
  true
FROM coral_species cs
JOIN (VALUES
  ('Utter Chaos', 'Iconic multi-colored Zoa with red, purple, and gold rings', 'Ultra Rare'),
  ('Eagle Eye', 'Bright green and orange Zoanthid with ringed eye pattern', 'Rare'),
  ('Rastas', 'Jamaican flag inspired Zoa with red, gold, and green', 'Uncommon'),
  ('Armor of God', 'Deep purple and gold premium collector Zoanthid', 'Ultra Rare'),
  ('Sunny D', 'Bright orange and yellow Zoa named after the drink', 'Uncommon'),
  ('Space Monster', 'Deep space blue and green multi-tone Zoanthid', 'Rare'),
  ('Fruit Loop', 'Colorful multi-ring Zoa resembling fruit loop cereal', 'Rare'),
  ('King Midas', 'All gold premium collector Zoanthid', 'Ultra Rare'),
  ('Purple Deaths', 'Deep violet and black rare collector Zoanthid', 'Ultra Rare'),
  ('Bam Bams', 'Orange and yellow high-contrast collector Zoanthid', 'Rare')
) AS m(morph_name, description, rarity_tier)
ON cs.genus = 'Zoanthus' AND cs.species = 'sociatus'
ON CONFLICT DO NOTHING;

-- ============================================================
-- BADGES
-- ============================================================

INSERT INTO badges (name, description, icon, color) VALUES
  ('Trusted Seller', 'Completed 10+ verified sales with 4.5+ rating', 'shield-check', '#22c55e'),
  ('Frequent Trader', 'Completed 5+ successful trades', 'repeat', '#3b82f6'),
  ('Rare Holder', 'Has Rare or higher corals in their collection', 'gem', '#f59e0b'),
  ('Grail Collector', 'Owns at least one Grail tier coral', 'crown', '#ef4444'),
  ('Coral Farm', 'Verified coral aquaculture operation', 'sprout', '#10b981'),
  ('Verified Vendor', 'Identity-verified commercial seller', 'badge-check', '#06b6d4'),
  ('Community Contributor', 'Submitted 20+ price data points', 'trending-up', '#8b5cf6'),
  ('Price Tracker Pro', 'Set and triggered 5+ price alerts', 'bell', '#f97316')
ON CONFLICT (name) DO NOTHING;
