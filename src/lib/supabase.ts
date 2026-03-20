import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserRole = 'hobbyist' | 'vendor' | 'farm';
export type RarityTier = 'Common' | 'Uncommon' | 'Rare' | 'Ultra Rare' | 'Grail';
export type CareDifficulty = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
export type ListingType = 'sale' | 'trade' | 'both';
export type ListingStatus = 'active' | 'sold' | 'traded' | 'expired' | 'removed';
export type CoralGroup = 'SPS' | 'LPS' | 'Soft Coral';

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  role: UserRole;
  location_city: string | null;
  location_state: string | null;
  location_country: string;
  reputation_score: number;
  total_reviews: number;
  total_sales: number;
  total_trades: number;
  is_verified: boolean;
  created_at: string;
}

export interface CoralSpecies {
  id: string;
  coral_group: CoralGroup;
  genus: string;
  species: string;
  common_name: string | null;
  rarity_tier: RarityTier;
  care_difficulty: CareDifficulty;
  light_requirement: string | null;
  flow_requirement: string | null;
  description: string | null;
}

export interface CoralMorph {
  id: string;
  species_id: string;
  morph_name: string;
  description: string | null;
  rarity_tier: RarityTier;
  is_collector_morph: boolean;
  coral_species?: CoralSpecies;
}

export interface Listing {
  id: string;
  seller_id: string;
  species_id: string | null;
  morph_id: string | null;
  listing_type: ListingType;
  status: ListingStatus;
  title: string;
  description: string | null;
  asking_price: number | null;
  trade_for: string | null;
  frag_size: string | null;
  care_difficulty: CareDifficulty | null;
  light_requirement: string | null;
  flow_requirement: string | null;
  is_shipping_available: boolean;
  is_local_pickup: boolean;
  location_city: string | null;
  location_state: string | null;
  views: number;
  is_wysiwyg: boolean;
  is_aquacultured: boolean;
  is_beginner_friendly: boolean;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
  coral_species?: CoralSpecies;
  coral_morphs?: CoralMorph;
  listing_images?: ListingImage[];
}

export interface ListingImage {
  id: string;
  listing_id: string;
  url: string;
  is_primary: boolean;
  sort_order: number;
}

export interface PriceHistory {
  id: string;
  species_id: string | null;
  morph_id: string | null;
  user_id: string;
  sale_price: number;
  frag_size: string | null;
  location_state: string | null;
  sold_at: string;
}

export interface HaveListItem {
  id: string;
  user_id: string;
  coral_type: string | null;
  species_id: string | null;
  morph_id: string | null;
  notes: string | null;
  quantity: number;
  asking_price: number | null;
  image_url: string | null;
  is_active: boolean;
  coral_species?: CoralSpecies;
  coral_morphs?: CoralMorph;
  profiles?: Profile;
}

export interface WantListItem {
  id: string;
  user_id: string;
  coral_type: string | null;
  species_id: string | null;
  morph_id: string | null;
  max_price: number | null;
  notes: string | null;
  image_url: string | null;
  is_active: boolean;
  coral_species?: CoralSpecies;
  coral_morphs?: CoralMorph;
  profiles?: Profile;
}

export interface TradeMatch {
  id: string;
  user_a_id: string;
  user_b_id: string;
  status: 'pending' | 'contacted' | 'completed' | 'declined';
  created_at: string;
  user_a?: Profile;
  user_b?: Profile;
  user_a_have?: HaveListItem;
  user_b_have?: HaveListItem;
}

export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  listing_id: string | null;
  trade_match_id: string | null;
  content: string;
  status: 'sent' | 'read';
  created_at: string;
  sender?: Profile;
  recipient?: Profile;
}

export interface Review {
  id: string;
  reviewer_id: string;
  reviewed_id: string;
  listing_id: string | null;
  rating: number;
  comment: string | null;
  transaction_type: ListingType | null;
  created_at: string;
  reviewer?: Profile;
}

export interface Badge {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
}

export interface VendorScrapeConfig {
  id: string;
  slug: string;
  name: string;
  base_url: string;
  public_url: string | null;
  coral_collections: string[];
  fish_collections: string[];
  is_active: boolean;
  created_at: string;
}

export interface VendorProduct {
  id: string;
  vendor_slug: string;
  shopify_id: number;
  handle: string;
  title: string;
  product_type: string;
  collection: string;
  price: number;
  compare_at_price: number | null;
  image_url: string | null;
  tags: string[];
  description: string | null;
  scraped_at: string;
  is_available: boolean;
}

export interface VendorScrapeRun {
  id: string;
  vendor_slug: string;
  started_at: string;
  completed_at: string | null;
  products_found: number;
  status: string;
  error_message: string | null;
}

export interface VendorPriceHistory {
  id: string;
  vendor_slug: string;
  shopify_id: number;
  handle: string;
  title: string;
  price: number;
  compare_at_price: number | null;
  price_change: number | null;
  price_change_pct: number | null;
  recorded_at: string;
}

export interface WwcProduct {
  id: string;
  shopify_id: number;
  handle: string;
  title: string;
  product_type: string;
  collection: string;
  price: number;
  compare_at_price: number | null;
  image_url: string | null;
  tags: string[];
  description: string | null;
  scraped_at: string;
  is_available: boolean;
}

export interface WwcScrapeRun {
  id: string;
  started_at: string;
  completed_at: string | null;
  collections_scraped: string[];
  products_found: number;
  products_inserted: number;
  products_updated: number;
  status: string;
  error_message: string | null;
}
