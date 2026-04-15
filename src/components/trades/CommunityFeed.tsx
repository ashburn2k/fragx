import { useEffect, useState, useCallback } from 'react';
import { Search, X, ArrowLeftRight, MapPin, Package, Truck, MessageSquare, ChevronDown, SlidersHorizontal, LogIn } from 'lucide-react';
import { supabase, HaveListItem } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import HaveListCard from './HaveListCard';

const CORAL_TYPES = ['SPS', 'LPS', 'Soft Coral', 'Equipment', 'Tank', 'Light', 'Other'];
const PAGE_SIZE = 24;

type SortOption = 'newest' | 'price_asc' | 'price_desc';

interface CommunityFeedProps {
  onContactSeller: (sellerId: string, sellerName: string) => void;
  onAuthRequired: () => void;
}

export default function CommunityFeed({ onContactSeller, onAuthRequired }: CommunityFeedProps) {
  const { user } = useAuth();
  const [items, setItems] = useState<HaveListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterPriced, setFilterPriced] = useState<'all' | 'sale' | 'trade'>('all');
  const [sort, setSort] = useState<SortOption>('newest');
  const [selected, setSelected] = useState<HaveListItem | null>(null);
  const [contacting, setContacting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [totalCount, setTotalCount] = useState<number | null>(null);

  const fetchItems = useCallback(async (reset = false) => {
    const currentPage = reset ? 0 : page;
    if (reset) setLoading(true);
    else setLoadingMore(true);

    let query = supabase
      .from('have_list')
      .select('*, profiles(id, username, display_name, role, reputation_score, total_reviews, location_city, location_state, avatar_url)', { count: 'exact' })
      .eq('is_active', true);

    if (filterType) query = query.eq('coral_type', filterType);
    if (filterPriced === 'sale') query = query.not('asking_price', 'is', null);
    if (filterPriced === 'trade') query = query.is('asking_price', null);
    if (search.trim()) query = query.ilike('coral_type', `%${search.trim()}%`).or(`notes.ilike.%${search.trim()}%`);

    if (sort === 'newest') query = query.order('created_at', { ascending: false });
    else if (sort === 'price_asc') query = query.order('asking_price', { ascending: true, nullsFirst: false });
    else if (sort === 'price_desc') query = query.order('asking_price', { ascending: false, nullsFirst: false });

    query = query.range(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE - 1);

    const { data, error, count } = await query;
    if (!error && data) {
      setItems(prev => reset ? data : [...prev, ...data]);
      setHasMore(data.length === PAGE_SIZE);
      if (count !== null) setTotalCount(count);
      if (!reset) setPage(currentPage + 1);
    }

    if (reset) setLoading(false);
    else setLoadingMore(false);
  }, [filterType, filterPriced, sort, search, page]);

  useEffect(() => {
    setPage(0);
    fetchItems(true);
  }, [filterType, filterPriced, sort]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      setPage(0);
      fetchItems(true);
    }, 350);
    return () => clearTimeout(debounce);
  }, [search]);

  async function handleContact() {
    if (!user) { onAuthRequired(); return; }
    if (!selected) return;
    const sellerId = (selected.profiles as HaveListItem['profiles'] & { id?: string })?.id ?? (selected as HaveListItem & { user_id: string }).user_id;
    const sellerName = selected.profiles?.username ?? 'Member';

    setContacting(true);
    const msg = `Hi, I'm interested in your ${selected.coral_type ?? 'coral'} listing${selected.asking_price ? ` ($${selected.asking_price})` : ''}!`;
    await supabase.from('messages').insert({
      sender_id: user.id,
      recipient_id: sellerId,
      content: msg,
    });
    setContacting(false);
    setSelected(null);
    onContactSeller(sellerId, sellerName);
  }

  const activeFilterCount = [filterType, filterPriced !== 'all' ? filterPriced : null].filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Search + filter bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search corals..."
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-sm transition-colors"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
              <X size={14} />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(f => !f)}
          className={`relative flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
            showFilters || activeFilterCount > 0
              ? 'bg-cyan-50 dark:bg-cyan-500/10 border-cyan-300 dark:border-cyan-700 text-cyan-700 dark:text-cyan-400'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
          }`}
        >
          <SlidersHorizontal size={14} />
          <span className="hidden sm:inline">Filters</span>
          {activeFilterCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-cyan-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
        <div className="relative">
          <select
            value={sort}
            onChange={e => setSort(e.target.value as SortOption)}
            className="appearance-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-3 pr-8 py-2.5 text-slate-700 dark:text-slate-300 text-sm focus:outline-none focus:border-cyan-500 transition-colors cursor-pointer"
          >
            <option value="newest">Newest</option>
            <option value="price_asc">Price: Low</option>
            <option value="price_desc">Price: High</option>
          </select>
          <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Expanded filters */}
      {showFilters && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-4">
          <div className="space-y-2">
            <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wide">Coral Type</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterType(null)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  !filterType
                    ? 'bg-cyan-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                All Types
              </button>
              {CORAL_TYPES.map(t => (
                <button
                  key={t}
                  onClick={() => setFilterType(filterType === t ? null : t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    filterType === t
                      ? 'bg-cyan-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wide">Listing Type</p>
            <div className="flex gap-2">
              {(['all', 'sale', 'trade'] as const).map(opt => (
                <button
                  key={opt}
                  onClick={() => setFilterPriced(opt)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    filterPriced === opt
                      ? 'bg-cyan-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {opt === 'all' ? 'All' : opt === 'sale' ? 'For Sale' : 'Trade Only'}
                </button>
              ))}
            </div>
          </div>
          {activeFilterCount > 0 && (
            <button
              onClick={() => { setFilterType(null); setFilterPriced('all'); }}
              className="text-xs text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Type chips (quick filter row) */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setFilterType(null)}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            !filterType ? 'bg-cyan-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          All
        </button>
        {CORAL_TYPES.map(t => (
          <button
            key={t}
            onClick={() => setFilterType(filterType === t ? null : t)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              filterType === t ? 'bg-cyan-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Results count */}
      {!loading && totalCount !== null && (
        <p className="text-slate-400 dark:text-slate-500 text-xs">
          {totalCount} {totalCount === 1 ? 'listing' : 'listings'} available
        </p>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden animate-pulse">
              <div className="aspect-[4/3] bg-slate-200 dark:bg-slate-800" />
              <div className="p-3.5 space-y-2">
                <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
          <ArrowLeftRight size={36} className="text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">No listings found</p>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Try adjusting your filters or check back later</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {items.map(item => (
              <HaveListCard key={item.id} item={item} onClick={() => setSelected(item)} />
            ))}
          </div>
          {hasMore && (
            <div className="text-center pt-2">
              <button
                onClick={() => fetchItems(false)}
                disabled={loadingMore}
                className="px-6 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
              >
                {loadingMore ? 'Loading...' : 'Load more'}
              </button>
            </div>
          )}
        </>
      )}

      {/* Detail modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setSelected(null)}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="relative aspect-[16/9] overflow-hidden bg-slate-100 dark:bg-slate-800 rounded-t-3xl sm:rounded-t-2xl">
              <img
                src={selected.image_url ?? 'https://images.pexels.com/photos/1618606/pexels-photo-1618606.jpeg?auto=compress&cs=tinysrgb&w=800'}
                alt={selected.coral_type ?? 'Coral'}
                className="w-full h-full object-cover"
                onError={e => { (e.target as HTMLImageElement).src = 'https://images.pexels.com/photos/1618606/pexels-photo-1618606.jpeg?auto=compress&cs=tinysrgb&w=800'; }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <button
                onClick={() => setSelected(null)}
                className="absolute top-3 right-3 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 transition-colors"
              >
                <X size={16} />
              </button>
              {selected.asking_price != null ? (
                <div className="absolute bottom-3 left-4">
                  <span className="text-white font-bold text-2xl drop-shadow">
                    ${selected.asking_price.toLocaleString()}
                  </span>
                </div>
              ) : (
                <div className="absolute bottom-3 left-4">
                  <span className="flex items-center gap-1.5 text-orange-300 font-semibold text-sm">
                    <ArrowLeftRight size={14} />
                    Trade Only
                  </span>
                </div>
              )}
            </div>

            <div className="p-5 space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-400 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                    {selected.coral_type ?? 'Unknown'}
                  </span>
                  <span className="text-slate-400 dark:text-slate-500 text-xs">Qty: {selected.quantity}</span>
                </div>
                {selected.notes && (
                  <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">{selected.notes}</p>
                )}
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3.5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                  {selected.profiles?.username?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-900 dark:text-white font-medium text-sm">
                      {selected.profiles?.display_name ?? selected.profiles?.username ?? 'Member'}
                    </span>
                    {selected.profiles?.role && selected.profiles.role !== 'hobbyist' && (
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                        selected.profiles.role === 'farm'
                          ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400'
                          : 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400'
                      }`}>
                        {selected.profiles.role === 'farm' ? 'Farm' : 'Vendor'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {selected.profiles?.reputation_score != null && selected.profiles.reputation_score > 0 && (
                      <span className="text-slate-400 dark:text-slate-500 text-xs">
                        {selected.profiles.reputation_score.toFixed(1)} rep
                      </span>
                    )}
                    {selected.profiles?.location_state && (
                      <span className="text-slate-400 dark:text-slate-500 text-xs flex items-center gap-0.5">
                        <MapPin size={9} />
                        {selected.profiles.location_city
                          ? `${selected.profiles.location_city}, ${selected.profiles.location_state}`
                          : selected.profiles.location_state}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {!user ? (
                <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-center space-y-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center mx-auto">
                    <LogIn size={16} className="text-slate-500 dark:text-slate-400" />
                  </div>
                  <div>
                    <p className="text-slate-900 dark:text-white font-medium text-sm">Sign in to contact this seller</p>
                    <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Create a free account to message sellers and post your own listings</p>
                  </div>
                  <button
                    onClick={onAuthRequired}
                    className="w-full bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-400 hover:to-teal-500 text-white font-semibold py-2.5 rounded-xl transition-all text-sm"
                  >
                    Sign In / Register
                  </button>
                </div>
              ) : user.id === selected.user_id ? (
                <div className="text-center py-2 text-slate-400 dark:text-slate-500 text-sm">
                  This is your listing
                </div>
              ) : (
                <button
                  onClick={handleContact}
                  disabled={contacting}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-400 hover:to-teal-500 text-white font-semibold py-3.5 rounded-xl transition-all disabled:opacity-60 text-sm"
                >
                  <MessageSquare size={16} />
                  {contacting ? 'Sending...' : 'Contact Seller'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
