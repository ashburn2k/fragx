import { useEffect, useState, useCallback } from 'react';
import { Search, SlidersHorizontal, Plus, X, Filter } from 'lucide-react';
import { supabase, Listing, CoralGroup, RarityTier, ListingType, UserRole } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import ListingCard from '../components/marketplace/ListingCard';
import ListingDetail from '../components/marketplace/ListingDetail';
import CreateListing from '../components/marketplace/CreateListing';

const GROUPS: CoralGroup[] = ['SPS', 'LPS', 'Soft Coral'];
const RARITIES: RarityTier[] = ['Common', 'Uncommon', 'Rare', 'Ultra Rare', 'Grail'];
const TYPES: { value: ListingType | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'sale', label: 'For Sale' },
  { value: 'trade', label: 'Trade' },
  { value: 'both', label: 'Sale/Trade' },
];

const SELLER_TYPES: { value: UserRole | 'all'; label: string; desc: string }[] = [
  { value: 'all', label: 'All Sellers', desc: '' },
  { value: 'farm', label: 'Coral Farms', desc: 'Aquaculture operations' },
  { value: 'vendor', label: 'Vendors', desc: 'Independent sellers' },
  { value: 'hobbyist', label: 'Hobbyists', desc: 'Garage / hobbyist sellers' },
];

interface Filters {
  search: string;
  group: CoralGroup | '';
  rarity: RarityTier | '';
  type: ListingType | 'all';
  sellerType: UserRole | 'all';
  minPrice: string;
  maxPrice: string;
  shipping: boolean;
  local: boolean;
  aquacultured: boolean;
  wysiwyg: boolean;
  beginnerFriendly: boolean;
}

const defaultFilters: Filters = {
  search: '', group: '', rarity: '', type: 'all', sellerType: 'all',
  minPrice: '', maxPrice: '', shipping: false, local: false,
  aquacultured: false, wysiwyg: false, beginnerFriendly: false,
};

export default function MarketplacePage() {
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('listings')
      .select('*, profiles(*), coral_species(*), coral_morphs(*), listing_images(*)')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (filters.type !== 'all') query = query.eq('listing_type', filters.type);
    if (filters.group) query = query.eq('coral_species.coral_group', filters.group);
    if (filters.rarity) query = query.eq('coral_species.rarity_tier', filters.rarity);
    if (filters.minPrice) query = query.gte('asking_price', parseFloat(filters.minPrice));
    if (filters.maxPrice) query = query.lte('asking_price', parseFloat(filters.maxPrice));
    if (filters.shipping) query = query.eq('is_shipping_available', true);
    if (filters.local) query = query.eq('is_local_pickup', true);
    if (filters.aquacultured) query = query.eq('is_aquacultured', true);
    if (filters.wysiwyg) query = query.eq('is_wysiwyg', true);
    if (filters.beginnerFriendly) query = query.eq('is_beginner_friendly', true);

    const { data } = await query;
    let results = data ?? [];

    if (filters.sellerType !== 'all') {
      results = results.filter(l => l.profiles?.role === filters.sellerType);
    }

    if (filters.search) {
      const s = filters.search.toLowerCase();
      results = results.filter(l =>
        l.title.toLowerCase().includes(s) ||
        l.coral_species?.genus?.toLowerCase().includes(s) ||
        l.coral_species?.species?.toLowerCase().includes(s) ||
        l.coral_species?.common_name?.toLowerCase().includes(s) ||
        l.coral_morphs?.morph_name?.toLowerCase().includes(s)
      );
    }

    setListings(results);
    setLoading(false);
  }, [filters]);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  const activeFilterCount = [
    filters.group, filters.rarity, filters.type !== 'all', filters.sellerType !== 'all',
    filters.minPrice, filters.maxPrice, filters.shipping,
    filters.local, filters.aquacultured, filters.wysiwyg, filters.beginnerFriendly,
  ].filter(Boolean).length;

  if (selectedListing) {
    return <ListingDetail listing={selectedListing} onBack={() => setSelectedListing(null)} onRefresh={fetchListings} />;
  }

  if (showCreate) {
    return <CreateListing onBack={() => { setShowCreate(false); fetchListings(); }} />;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Marketplace</h1>
          <p className="text-slate-400 text-sm mt-0.5">{listings.length} active listings</p>
        </div>
        {user && (
          <button
            onClick={() => setShowCreate(true)}
            className="bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-400 hover:to-teal-500 text-white font-semibold px-4 py-2 rounded-xl transition-all duration-200 flex items-center gap-2 text-sm"
          >
            <Plus size={16} />
            List Coral
          </button>
        )}
      </div>

      {/* Search + Filter bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
            placeholder="Search corals, morphs, species..."
            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors text-sm"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200 ${
            showFilters || activeFilterCount > 0
              ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400'
              : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'
          }`}
        >
          <SlidersHorizontal size={16} />
          Filter
          {activeFilterCount > 0 && (
            <span className="bg-cyan-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Listing type pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {TYPES.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilters(f => ({ ...f, type: value }))}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
              filters.type === value
                ? 'bg-cyan-500 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            {label}
          </button>
        ))}
        <div className="w-px bg-slate-700 flex-shrink-0 mx-1 self-stretch" />
        {SELLER_TYPES.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilters(f => ({ ...f, sellerType: value as UserRole | 'all' }))}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
              filters.sellerType === value
                ? value === 'farm'
                  ? 'bg-emerald-500 text-white'
                  : value === 'vendor'
                  ? 'bg-blue-500 text-white'
                  : value === 'hobbyist'
                  ? 'bg-amber-500 text-white'
                  : 'bg-cyan-500 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Filter size={16} className="text-cyan-400" />
              Filters
            </h3>
            <div className="flex items-center gap-2">
              {activeFilterCount > 0 && (
                <button
                  onClick={() => setFilters(defaultFilters)}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors"
                >
                  Clear all
                </button>
              )}
              <button onClick={() => setShowFilters(false)} className="text-slate-400 hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Group */}
          <div>
            <label className="text-xs text-slate-400 uppercase tracking-wider mb-2 block">Coral Group</label>
            <div className="flex flex-wrap gap-2">
              {GROUPS.map(g => (
                <button
                  key={g}
                  onClick={() => setFilters(f => ({ ...f, group: f.group === g ? '' : g }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                    filters.group === g ? 'bg-cyan-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Rarity */}
          <div>
            <label className="text-xs text-slate-400 uppercase tracking-wider mb-2 block">Rarity</label>
            <div className="flex flex-wrap gap-2">
              {RARITIES.map(r => (
                <button
                  key={r}
                  onClick={() => setFilters(f => ({ ...f, rarity: f.rarity === r ? '' : r }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                    filters.rarity === r ? 'bg-cyan-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Seller Type */}
          <div>
            <label className="text-xs text-slate-400 uppercase tracking-wider mb-2 block">Seller Type</label>
            <div className="grid grid-cols-2 gap-2">
              {SELLER_TYPES.filter(s => s.value !== 'all').map(({ value, label, desc }) => (
                <button
                  key={value}
                  onClick={() => setFilters(f => ({ ...f, sellerType: f.sellerType === value ? 'all' : value as UserRole }))}
                  className={`flex flex-col items-start px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 text-left ${
                    filters.sellerType === value
                      ? 'bg-cyan-500 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <span className="font-semibold">{label}</span>
                  {desc && <span className={`mt-0.5 ${filters.sellerType === value ? 'text-cyan-100' : 'text-slate-500'}`}>{desc}</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Price range */}
          <div>
            <label className="text-xs text-slate-400 uppercase tracking-wider mb-2 block">Price Range</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                value={filters.minPrice}
                onChange={e => setFilters(f => ({ ...f, minPrice: e.target.value }))}
                placeholder="Min $"
                type="number"
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500 placeholder-slate-500"
              />
              <input
                value={filters.maxPrice}
                onChange={e => setFilters(f => ({ ...f, maxPrice: e.target.value }))}
                placeholder="Max $"
                type="number"
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500 placeholder-slate-500"
              />
            </div>
          </div>

          {/* Toggles */}
          <div>
            <label className="text-xs text-slate-400 uppercase tracking-wider mb-2 block">Tags</label>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'shipping', label: 'Ships' },
                { key: 'local', label: 'Local Pickup' },
                { key: 'aquacultured', label: 'Aquacultured' },
                { key: 'wysiwyg', label: 'WYSIWYG' },
                { key: 'beginnerFriendly', label: 'Beginner Friendly' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilters(f => ({ ...f, [key]: !f[key as keyof Filters] }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                    filters[key as keyof Filters]
                      ? 'bg-cyan-500 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Listings grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl h-72 animate-pulse" />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-20 bg-slate-900 border border-slate-800 rounded-2xl">
          <Search size={40} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 mb-2">No listings found</p>
          <p className="text-slate-500 text-sm">Try adjusting your filters</p>
          {activeFilterCount > 0 && (
            <button
              onClick={() => setFilters(defaultFilters)}
              className="mt-4 text-cyan-400 hover:text-cyan-300 text-sm transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map(listing => (
            <ListingCard key={listing.id} listing={listing} onClick={() => setSelectedListing(listing)} />
          ))}
        </div>
      )}
    </div>
  );
}
