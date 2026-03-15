
/*
  # Seed Coral Species Database

  ## Overview
  Inserts the complete coral taxonomy from the master prompt into coral_species.
  Covers all three primary groups: SPS, LPS, and Soft Corals with all genera
  and species listed. Rarity tiers assigned based on hobby community standards.

  ## Groups
  1. SPS — Acropora, Montipora, Seriatopora, Stylophora, Pocillopora, Porites, Pavona, Hydnophora, Psammocora, Leptoseris
  2. LPS — Acanthastrea, Blastomussa, Brain Corals, Candy Cane, Chalice, Duncan, Elegance, Euphyllia, Favia/Favites, Goniopora, Micromussa, Galaxea, Plate, Maze/Star, Pectinia, Bubble, Scolymia, Torch/Hammer morphs
  3. Soft Corals — Leathers, Zoanthids, Ricordea, Rhodactis, Discosoma, Amplexidiscus, Gorgonians, Xenia, Encrusting, Tree Corals
*/

INSERT INTO coral_species (coral_group, genus, species, common_name, rarity_tier, care_difficulty, light_requirement, flow_requirement) VALUES

-- ============================================================
-- SPS — ACROPORA
-- ============================================================
('SPS', 'Acropora', 'millepora', 'Millepora Acropora', 'Uncommon', 'Advanced', 'High', 'High'),
('SPS', 'Acropora', 'tortuosa', 'Tortuosa Acropora', 'Rare', 'Advanced', 'High', 'High'),
('SPS', 'Acropora', 'valida', 'Valida Acropora', 'Uncommon', 'Advanced', 'High', 'High'),
('SPS', 'Acropora', 'lokani', 'Lokani Acropora', 'Rare', 'Expert', 'High', 'High'),
('SPS', 'Acropora', 'tenuis', 'Tenuis Acropora', 'Uncommon', 'Advanced', 'High', 'High'),
('SPS', 'Acropora', 'caroliniana', 'Caroliniana Acropora', 'Rare', 'Advanced', 'High', 'High'),
('SPS', 'Acropora', 'hyacinthus', 'Table Acropora', 'Rare', 'Expert', 'High', 'High'),
('SPS', 'Acropora', 'nana', 'Nana Acropora', 'Uncommon', 'Advanced', 'High', 'High'),
('SPS', 'Acropora', 'secale', 'Secale Acropora', 'Rare', 'Expert', 'High', 'High'),
('SPS', 'Acropora', 'microclados', 'Microclados Acropora', 'Ultra Rare', 'Expert', 'High', 'High'),

-- ============================================================
-- SPS — MONTIPORA
-- ============================================================
('SPS', 'Montipora', 'capricornis', 'Plating Montipora', 'Common', 'Beginner', 'Medium', 'Medium'),
('SPS', 'Montipora', 'undata', 'Wavy Montipora', 'Uncommon', 'Intermediate', 'Medium', 'Medium'),
('SPS', 'Montipora', 'confusa', 'Confusa Montipora', 'Uncommon', 'Intermediate', 'Medium', 'Medium'),
('SPS', 'Montipora', 'digitata', 'Branching Montipora', 'Common', 'Beginner', 'Medium', 'Medium'),
('SPS', 'Montipora', 'tuberculosa', 'Tuberculosa Montipora', 'Uncommon', 'Intermediate', 'Medium', 'Medium'),
('SPS', 'Montipora', 'spumosa', 'Spumosa Montipora', 'Rare', 'Advanced', 'Medium', 'Medium'),

-- ============================================================
-- SPS — SERIATOPORA
-- ============================================================
('SPS', 'Seriatopora', 'hystrix', 'Bird''s Nest Coral', 'Common', 'Intermediate', 'Medium', 'High'),
('SPS', 'Seriatopora', 'caliendrum', 'Caliendrum Bird''s Nest', 'Uncommon', 'Intermediate', 'Medium', 'High'),
('SPS', 'Seriatopora', 'guttatus', 'Guttatus Bird''s Nest', 'Rare', 'Advanced', 'Medium', 'High'),

-- ============================================================
-- SPS — STYLOPHORA
-- ============================================================
('SPS', 'Stylophora', 'pistillata', 'Stylophora', 'Common', 'Beginner', 'Medium', 'Medium'),
('SPS', 'Stylophora', 'mamillata', 'Mamillata Stylophora', 'Uncommon', 'Intermediate', 'Medium', 'Medium'),
('SPS', 'Stylophora', 'danae', 'Danae Stylophora', 'Rare', 'Advanced', 'High', 'Medium'),

-- ============================================================
-- SPS — POCILLOPORA
-- ============================================================
('SPS', 'Pocillopora', 'damicornis', 'Cauliflower Coral', 'Common', 'Beginner', 'Medium', 'Medium'),
('SPS', 'Pocillopora', 'verrucosa', 'Verrucose Pocillopora', 'Common', 'Beginner', 'Medium', 'Medium'),
('SPS', 'Pocillopora', 'eydouxi', 'Cauliflower Pocillopora', 'Uncommon', 'Intermediate', 'High', 'High'),
('SPS', 'Pocillopora', 'meandrina', 'Meandrina Pocillopora', 'Uncommon', 'Intermediate', 'High', 'High'),

-- ============================================================
-- SPS — PORITES
-- ============================================================
('SPS', 'Porites', 'cylindrica', 'Finger Porites', 'Common', 'Intermediate', 'Medium', 'Medium'),
('SPS', 'Porites', 'lobata', 'Massive Porites', 'Common', 'Intermediate', 'Medium', 'Medium'),
('SPS', 'Porites', 'rus', 'Rus Porites', 'Uncommon', 'Advanced', 'High', 'Medium'),

-- ============================================================
-- SPS — PAVONA
-- ============================================================
('SPS', 'Pavona', 'cactus', 'Cactus Coral', 'Uncommon', 'Intermediate', 'Medium', 'Medium'),
('SPS', 'Pavona', 'decussata', 'Pavona', 'Common', 'Intermediate', 'Medium', 'Medium'),
('SPS', 'Pavona', 'frondifera', 'Frond Pavona', 'Uncommon', 'Intermediate', 'Medium', 'Medium'),
('SPS', 'Pavona', 'maldivensis', 'Maldives Pavona', 'Rare', 'Advanced', 'Medium', 'Medium'),

-- ============================================================
-- SPS — HYDNOPHORA
-- ============================================================
('SPS', 'Hydnophora', 'exesa', 'Horn Coral', 'Uncommon', 'Intermediate', 'Medium', 'Medium'),
('SPS', 'Hydnophora', 'rigida', 'Rigid Horn Coral', 'Uncommon', 'Intermediate', 'Medium', 'Medium'),
('SPS', 'Hydnophora', 'microconos', 'Microconos Horn Coral', 'Rare', 'Advanced', 'Medium', 'Medium'),

-- ============================================================
-- SPS — PSAMMOCORA
-- ============================================================
('SPS', 'Psammocora', 'contigua', 'Psammocora', 'Common', 'Beginner', 'Medium', 'Medium'),
('SPS', 'Psammocora', 'digitata', 'Finger Psammocora', 'Common', 'Beginner', 'Medium', 'Medium'),
('SPS', 'Psammocora', 'superficialis', 'Superficialis Psammocora', 'Uncommon', 'Intermediate', 'Medium', 'Medium'),

-- ============================================================
-- SPS — LEPTOSERIS
-- ============================================================
('SPS', 'Leptoseris', 'hawaiiensis', 'Hawaiian Leptoseris', 'Rare', 'Advanced', 'Low', 'Low'),
('SPS', 'Leptoseris', 'yabei', 'Yabei Leptoseris', 'Rare', 'Advanced', 'Low', 'Low'),
('SPS', 'Leptoseris', 'scabra', 'Scabra Leptoseris', 'Ultra Rare', 'Expert', 'Low', 'Low'),

-- ============================================================
-- LPS — ACANTHASTREA
-- ============================================================
('LPS', 'Acanthastrea', 'lordhowensis', 'Acan Lord', 'Uncommon', 'Intermediate', 'Medium', 'Low'),
('LPS', 'Acanthastrea', 'echinata', 'Echinata Acan', 'Rare', 'Intermediate', 'Medium', 'Low'),
('LPS', 'Acanthastrea', 'bowerbanki', 'Bowerbanki Acan', 'Uncommon', 'Intermediate', 'Medium', 'Low'),
('LPS', 'Acanthastrea', 'rotundoflora', 'Rotundoflora Acan', 'Rare', 'Intermediate', 'Medium', 'Low'),

-- ============================================================
-- LPS — BLASTOMUSSA
-- ============================================================
('LPS', 'Blastomussa', 'wellsi', 'Blasto', 'Common', 'Beginner', 'Medium', 'Low'),
('LPS', 'Blastomussa', 'merleti', 'Merleti Blasto', 'Uncommon', 'Beginner', 'Medium', 'Low'),

-- ============================================================
-- LPS — BRAIN CORALS
-- ============================================================
('LPS', 'Trachyphyllia', 'geoffroyi', 'Open Brain Coral', 'Uncommon', 'Intermediate', 'Medium', 'Low'),
('LPS', 'Lobophyllia', 'hemprichii', 'Lobo Brain', 'Common', 'Beginner', 'Medium', 'Low'),
('LPS', 'Lobophyllia', 'corymbosa', 'Corymbosa Lobo', 'Uncommon', 'Beginner', 'Medium', 'Low'),
('LPS', 'Symphyllia', 'recta', 'Maze Brain', 'Uncommon', 'Intermediate', 'Medium', 'Low'),
('LPS', 'Symphyllia', 'wilsoni', 'Wilson''s Brain', 'Rare', 'Intermediate', 'Medium', 'Low'),
('LPS', 'Platygyra', 'sinensis', 'Maze Coral', 'Common', 'Beginner', 'Medium', 'Medium'),
('LPS', 'Favites', 'abdita', 'Moon Coral', 'Common', 'Beginner', 'Medium', 'Medium'),
('LPS', 'Favites', 'pentagona', 'War Coral', 'Common', 'Beginner', 'Medium', 'Medium'),
('LPS', 'Goniastrea', 'pectinata', 'Pineapple Coral', 'Common', 'Beginner', 'Medium', 'Medium'),
('LPS', 'Leptoria', 'phrygia', 'Grooved Brain Coral', 'Uncommon', 'Intermediate', 'Medium', 'Medium'),

-- ============================================================
-- LPS — CANDY CANE
-- ============================================================
('LPS', 'Caulastrea', 'furcata', 'Candy Cane Coral', 'Common', 'Beginner', 'Medium', 'Low'),
('LPS', 'Caulastrea', 'curvata', 'Curvata Candy Cane', 'Common', 'Beginner', 'Medium', 'Low'),
('LPS', 'Caulastrea', 'echinulata', 'Trumpet Coral', 'Uncommon', 'Beginner', 'Medium', 'Low'),

-- ============================================================
-- LPS — CHALICE CORALS
-- ============================================================
('LPS', 'Echinophyllia', 'aspera', 'Chalice Coral', 'Uncommon', 'Intermediate', 'Medium', 'Low'),
('LPS', 'Echinophyllia', 'orpheensis', 'Orpheensis Chalice', 'Rare', 'Intermediate', 'Medium', 'Low'),
('LPS', 'Oxypora', 'lacera', 'Oxypora Chalice', 'Rare', 'Intermediate', 'Medium', 'Low'),
('LPS', 'Oxypora', 'glabra', 'Glabra Chalice', 'Rare', 'Intermediate', 'Medium', 'Low'),
('LPS', 'Mycedium', 'elephantotus', 'Elephant Ear Chalice', 'Rare', 'Advanced', 'Medium', 'Low'),

-- ============================================================
-- LPS — DUNCAN
-- ============================================================
('LPS', 'Duncanopsammia', 'axifuga', 'Duncan Coral', 'Common', 'Beginner', 'Medium', 'Low'),

-- ============================================================
-- LPS — ELEGANCE
-- ============================================================
('LPS', 'Catalaphyllia', 'jardinei', 'Elegance Coral', 'Uncommon', 'Advanced', 'Medium', 'Low'),

-- ============================================================
-- LPS — EUPHYLLIA
-- ============================================================
('LPS', 'Euphyllia', 'ancora', 'Hammer Coral', 'Common', 'Beginner', 'Medium', 'Medium'),
('LPS', 'Euphyllia', 'divisa', 'Frogspawn Coral', 'Common', 'Beginner', 'Medium', 'Medium'),
('LPS', 'Euphyllia', 'glabrescens', 'Torch Coral', 'Common', 'Beginner', 'Medium', 'Medium'),
('LPS', 'Euphyllia', 'cristata', 'Grape Coral', 'Uncommon', 'Intermediate', 'Medium', 'Medium'),
('LPS', 'Euphyllia', 'paradivisa', 'Branching Frogspawn', 'Uncommon', 'Intermediate', 'Medium', 'Medium'),
('LPS', 'Euphyllia', 'paraancora', 'Branching Hammer', 'Uncommon', 'Intermediate', 'Medium', 'Medium'),

-- ============================================================
-- LPS — FAVIA AND FAVITES
-- ============================================================
('LPS', 'Favia', 'speciosa', 'Moon Coral', 'Common', 'Beginner', 'Medium', 'Medium'),
('LPS', 'Favia', 'pallida', 'Pallid Brain Coral', 'Common', 'Beginner', 'Medium', 'Medium'),
('LPS', 'Favia', 'matthaii', 'Matthaii Brain Coral', 'Uncommon', 'Intermediate', 'Medium', 'Medium'),
('LPS', 'Favites', 'complanata', 'Complanata Favites', 'Uncommon', 'Intermediate', 'Medium', 'Medium'),
('LPS', 'Favites', 'flexuosa', 'Flexuosa Favites', 'Uncommon', 'Intermediate', 'Medium', 'Medium'),

-- ============================================================
-- LPS — GONIOPORA AND ALVEOPORA
-- ============================================================
('LPS', 'Goniopora', 'lobata', 'Flowerpot Coral', 'Uncommon', 'Advanced', 'Medium', 'Low'),
('LPS', 'Goniopora', 'columna', 'Column Flowerpot', 'Uncommon', 'Advanced', 'Medium', 'Low'),
('LPS', 'Goniopora', 'djiboutiensis', 'Djibouti Flowerpot', 'Rare', 'Advanced', 'Medium', 'Low'),
('LPS', 'Alveopora', 'allingi', 'Alling''s Alveopora', 'Uncommon', 'Advanced', 'Medium', 'Low'),
('LPS', 'Alveopora', 'fenestrata', 'Fenestrate Alveopora', 'Uncommon', 'Advanced', 'Medium', 'Low'),

-- ============================================================
-- LPS — MICROMUSSA
-- ============================================================
('LPS', 'Micromussa', 'lordhowensis', 'Micro Lord', 'Uncommon', 'Intermediate', 'Medium', 'Low'),
('LPS', 'Micromussa', 'amakusensis', 'Amakusensis Micromussa', 'Rare', 'Intermediate', 'Medium', 'Low'),

-- ============================================================
-- LPS — GALAXEA
-- ============================================================
('LPS', 'Galaxea', 'fascicularis', 'Crystal Coral', 'Common', 'Intermediate', 'Medium', 'Medium'),
('LPS', 'Galaxea', 'astreata', 'Astreata Galaxea', 'Uncommon', 'Intermediate', 'Medium', 'Medium'),

-- ============================================================
-- LPS — PLATE CORALS
-- ============================================================
('LPS', 'Heliofungia', 'actiniformis', 'Long Tentacle Plate', 'Uncommon', 'Intermediate', 'Medium', 'Low'),
('LPS', 'Fungia', 'scutaria', 'Plate Coral', 'Common', 'Beginner', 'Medium', 'Low'),
('LPS', 'Fungia', 'repanda', 'Repanda Plate Coral', 'Common', 'Beginner', 'Medium', 'Low'),
('LPS', 'Cycloseris', 'tenuis', 'Thin Plate Coral', 'Uncommon', 'Intermediate', 'Medium', 'Low'),
('LPS', 'Lithophyllon', 'undulatum', 'Undulate Plate Coral', 'Rare', 'Advanced', 'Medium', 'Low'),

-- ============================================================
-- LPS — MAZE AND STAR CORALS
-- ============================================================
('LPS', 'Montastraea', 'cavernosa', 'Great Star Coral', 'Common', 'Beginner', 'Medium', 'Medium'),
('LPS', 'Orbicella', 'faveolata', 'Mountainous Star Coral', 'Common', 'Beginner', 'Medium', 'Medium'),
('LPS', 'Meandrina', 'meandrites', 'Maze Coral', 'Uncommon', 'Intermediate', 'Medium', 'Medium'),

-- ============================================================
-- LPS — PECTINIA
-- ============================================================
('LPS', 'Pectinia', 'alcicornis', 'Antler Pectinia', 'Rare', 'Advanced', 'Medium', 'Medium'),
('LPS', 'Pectinia', 'lactuca', 'Lettuce Coral', 'Rare', 'Advanced', 'Medium', 'Medium'),
('LPS', 'Pectinia', 'paeonia', 'Paeonia Pectinia', 'Ultra Rare', 'Expert', 'Medium', 'Medium'),

-- ============================================================
-- LPS — BUBBLE CORAL
-- ============================================================
('LPS', 'Plerogyra', 'sinuosa', 'Bubble Coral', 'Common', 'Intermediate', 'Medium', 'Low'),
('LPS', 'Plerogyra', 'simplex', 'Pearl Bubble Coral', 'Uncommon', 'Intermediate', 'Medium', 'Low'),
('LPS', 'Physogyra', 'lichtensteini', 'Small Bubble Coral', 'Uncommon', 'Intermediate', 'Medium', 'Low'),

-- ============================================================
-- LPS — SCOLYMIA
-- ============================================================
('LPS', 'Homophyllia', 'australis', 'Australian Scolymia', 'Rare', 'Intermediate', 'Medium', 'Low'),
('LPS', 'Scolymia', 'cubensis', 'Caribbean Scolymia', 'Rare', 'Intermediate', 'Medium', 'Low'),
('LPS', 'Scolymia', 'vitiensis', 'Vitiensis Scolymia', 'Ultra Rare', 'Advanced', 'Medium', 'Low'),

-- ============================================================
-- SOFT CORALS — LEATHER CORALS
-- ============================================================
('Soft Coral', 'Sarcophyton', 'trocheliophorum', 'Toadstool Leather', 'Common', 'Beginner', 'Medium', 'Medium'),
('Soft Coral', 'Sarcophyton', 'elegans', 'Elegant Toadstool', 'Uncommon', 'Beginner', 'Medium', 'Medium'),
('Soft Coral', 'Sinularia', 'dura', 'Finger Leather', 'Common', 'Beginner', 'Medium', 'Medium'),
('Soft Coral', 'Sinularia', 'flexibilis', 'Flexible Finger Leather', 'Common', 'Beginner', 'Medium', 'Medium'),
('Soft Coral', 'Lobophytum', 'pauciflorum', 'Devil''s Hand Leather', 'Uncommon', 'Intermediate', 'Medium', 'Medium'),
('Soft Coral', 'Cladiella', 'sp.', 'Colt Coral', 'Common', 'Beginner', 'Medium', 'Medium'),

-- ============================================================
-- SOFT CORALS — ZOANTHIDS AND PALYTHOA
-- ============================================================
('Soft Coral', 'Zoanthus', 'sociatus', 'Zoanthid', 'Common', 'Beginner', 'Medium', 'Low'),
('Soft Coral', 'Zoanthus', 'sansibaricus', 'Sansibar Zoanthid', 'Common', 'Beginner', 'Medium', 'Low'),
('Soft Coral', 'Palythoa', 'grandis', 'Paly', 'Common', 'Beginner', 'Medium', 'Low'),
('Soft Coral', 'Palythoa', 'caribaeorum', 'Caribbean Paly', 'Common', 'Beginner', 'Medium', 'Low'),
('Soft Coral', 'Palythoa', 'toxica', 'Toxic Paly', 'Uncommon', 'Intermediate', 'Medium', 'Low'),

-- ============================================================
-- SOFT CORALS — RICORDEA
-- ============================================================
('Soft Coral', 'Ricordea', 'florida', 'Caribbean Ricordea', 'Uncommon', 'Beginner', 'Medium', 'Low'),
('Soft Coral', 'Ricordea', 'yuma', 'Indo-Pacific Ricordea', 'Uncommon', 'Beginner', 'Medium', 'Low'),

-- ============================================================
-- SOFT CORALS — RHODACTIS MUSHROOMS
-- ============================================================
('Soft Coral', 'Rhodactis', 'indosinensis', 'Indo Rhodactis Mushroom', 'Common', 'Beginner', 'Low', 'Low'),
('Soft Coral', 'Rhodactis', 'osculifera', 'Bullseye Mushroom', 'Common', 'Beginner', 'Low', 'Low'),
('Soft Coral', 'Rhodactis', 'mussoides', 'Mushroom Coral', 'Common', 'Beginner', 'Low', 'Low'),
('Soft Coral', 'Rhodactis', 'howesii', 'Hairy Mushroom', 'Uncommon', 'Beginner', 'Low', 'Low'),

-- ============================================================
-- SOFT CORALS — DISCOSOMA MUSHROOMS
-- ============================================================
('Soft Coral', 'Discosoma', 'nummiforme', 'Discosoma Mushroom', 'Common', 'Beginner', 'Low', 'Low'),
('Soft Coral', 'Discosoma', 'sanctithomae', 'Mushroom Anemone', 'Common', 'Beginner', 'Low', 'Low'),
('Soft Coral', 'Discosoma', 'neglecta', 'Neglect Mushroom', 'Common', 'Beginner', 'Low', 'Low'),

-- ============================================================
-- SOFT CORALS — AMPLEXIDISCUS
-- ============================================================
('Soft Coral', 'Amplexidiscus', 'fenestrafer', 'Elephant Ear Mushroom', 'Uncommon', 'Intermediate', 'Medium', 'Low'),

-- ============================================================
-- SOFT CORALS — GORGONIANS
-- ============================================================
('Soft Coral', 'Eunicea', 'sp.', 'Knobby Sea Rod', 'Uncommon', 'Intermediate', 'Medium', 'High'),
('Soft Coral', 'Plexaura', 'sp.', 'Sea Rod Gorgonian', 'Uncommon', 'Intermediate', 'Medium', 'High'),
('Soft Coral', 'Muricella', 'sp.', 'Sea Fan Gorgonian', 'Rare', 'Advanced', 'Low', 'High'),
('Soft Coral', 'Rumphella', 'sp.', 'Rumphella Sea Fan', 'Rare', 'Advanced', 'Medium', 'High'),
('Soft Coral', 'Melithaea', 'sp.', 'Colorful Sea Fan', 'Rare', 'Advanced', 'Low', 'High'),

-- ============================================================
-- SOFT CORALS — XENIA
-- ============================================================
('Soft Coral', 'Xenia', 'elongata', 'Pulsing Xenia', 'Common', 'Beginner', 'Medium', 'Medium'),
('Soft Coral', 'Xenia', 'umbellata', 'Umbrella Xenia', 'Common', 'Beginner', 'Medium', 'Medium'),
('Soft Coral', 'Heteroxenia', 'fuscescens', 'Pom Pom Xenia', 'Common', 'Beginner', 'Medium', 'Medium'),

-- ============================================================
-- SOFT CORALS — ENCRUSTING AND CLOVE POLYPS
-- ============================================================
('Soft Coral', 'Clavularia', 'viridis', 'Clove Polyp', 'Common', 'Beginner', 'Medium', 'Medium'),
('Soft Coral', 'Briareum', 'asbestinum', 'Star Polyp', 'Common', 'Beginner', 'Medium', 'Medium'),
('Soft Coral', 'Pachyclavularia', 'violacea', 'Green Star Polyp', 'Common', 'Beginner', 'Medium', 'Medium'),

-- ============================================================
-- SOFT CORALS — TREE CORALS
-- ============================================================
('Soft Coral', 'Nephthea', 'sp.', 'Tree Coral', 'Uncommon', 'Intermediate', 'Medium', 'High'),
('Soft Coral', 'Litophyton', 'arboreum', 'Arboreum Tree Coral', 'Uncommon', 'Intermediate', 'Medium', 'High'),
('Soft Coral', 'Stereonephthya', 'sp.', 'Stereonephthya Tree Coral', 'Rare', 'Advanced', 'Medium', 'High')

ON CONFLICT (genus, species) DO NOTHING;
