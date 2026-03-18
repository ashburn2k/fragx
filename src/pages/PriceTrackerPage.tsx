import { useEffect, useState, useCallback, useRef, type ReactNode } from 'react';
import { Search, ExternalLink, SlidersHorizontal, X, ChevronDown, Tag, Store, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface CoralProduct {
  id: string;
  vendor_slug: string;
  vendor_name: string;
  title: string;
  price: number;
  compare_at_price: number | null;
  image_url: string | null;
  handle: string;
  collection: string;
  tags: string[];
  scraped_at: string;
  product_url: string;
}

const CORAL_GROUPS = ['All', 'SPS', 'LPS', 'Softies', 'Zoas', 'Mushrooms'];

const PRICE_RANGES = [
  { label: 'Any price', min: 0, max: Infinity },
  { label: 'Under $25', min: 0, max: 25 },
  { label: '$25 – $75', min: 25, max: 75 },
  { label: '$75 – $150', min: 75, max: 150 },
  { label: '$150 – $300', min: 150, max: 300 },
  { label: '$300+', min: 300, max: Infinity },
];

const GROUP_KEYWORDS: Record<string, string[]> = {
  SPS: ['acropora', 'montipora', 'seriatopora', 'stylophora', 'pocillopora', 'birdsnest', 'millepora', 'acro', 'millie', 'stag'],
  LPS: ['euphyllia', 'hammer', 'torch', 'frogspawn', 'trachyphyllia', 'brain', 'lobophyllia', 'goniopora', 'chalice', 'blastomussa', 'blasto', 'favia', 'favites', 'echinophyllia', 'micromussa', 'acan', 'scolymia', 'duncan', 'bubble', 'elegance', 'lps', 'ricordea', 'candy cane', 'caulastrea', 'fungia', 'plate coral', 'pavona', 'galaxea', 'pectinia', 'hydnophora'],
  Softies: ['leather', 'sarcophyton', 'sinularia', 'xenia', 'kenya tree', 'toadstool', 'softie', 'soft coral', 'clove', 'star polyp', 'gorgonian', 'sea fan'],
  Zoas: ['zoanthid', 'zoa', 'paly', 'palythoa', 'zoanthus', 'protopalythoa'],
  Mushrooms: ['mushroom', 'discosoma', 'rhodactis', 'ricordea', 'actinodiscus', 'amplexidiscus'],
};

const PAGE_SIZE = 48;

function matchesGroup(product: CoralProduct, group: string): boolean {
  if (group === 'All') return true;
  const keywords = GROUP_KEYWORDS[group] ?? [];
  const haystack = `${product.title} ${product.collection} ${(product.tags ?? []).join(' ')}`.toLowerCase();
  return keywords.some(kw => haystack.includes(kw));
}

function getDiscount(price: number, compare: number | null): number | null {
  if (!compare || compare <= price) return null;
  return Math.round(((compare - price) / compare) * 100);
}

export default function PriceTrackerPage() {
  const [products, setProducts] = useState<CoralProduct[]>([]);
  const [vendors, setVendors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [group, setGroup] = useState('All');
  const [priceRange, setPriceRange] = useState(0);
  const [vendorFilter, setVendorFilter] = useState('All');
  const [sortBy, setSortBy] = useState<'scraped_at' | 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc'>('scraped_at');
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [vendorOpen, setVendorOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    const range = PRICE_RANGES[priceRange];

    let query = supabase
      .from('coral_products')
      .select('*', { count: 'exact' });

    if (debouncedSearch) {
      query = query.ilike('title', `%${debouncedSearch}%`);
    }
    if (vendorFilter !== 'All') {
      query = query.eq('vendor_name', vendorFilter);
    }
    query = query.gte('price', range.min);
    if (range.max !== Infinity) query = query.lte('price', range.max);

    if (sortBy === 'price_asc') query = query.order('price', { ascending: true });
    else if (sortBy === 'price_desc') query = query.order('price', { ascending: false });
    else if (sortBy === 'name_asc') query = query.order('title', { ascending: true });
    else if (sortBy === 'name_desc') query = query.order('title', { ascending: false });
    else query = query.order('scraped_at', { ascending: false });

    query = query.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    const { data, count } = await query;
    let results = data ?? [];

    if (group !== 'All') {
      results = results.filter(p => matchesGroup(p as CoralProduct, group));
    }

    setProducts(results as CoralProduct[]);
    setTotalCount(count ?? 0);
    setLoading(false);
  }, [debouncedSearch, group, priceRange, vendorFilter, sortBy, page]);

  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, group, priceRange, vendorFilter, sortBy]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    supabase
      .from('coral_products')
      .select('vendor_name')
      .order('vendor_name')
      .then(({ data }) => {
        if (data) {
          const unique = [...new Set(data.map(r => r.vendor_name))];
          setVendors(unique);
        }
      });
  }, []);

  const activeFilters = [
    group !== 'All' && group,
    priceRange !== 0 && PRICE_RANGES[priceRange].label,
    vendorFilter !== 'All' && vendorFilter,
  ].filter(Boolean) as string[];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Price Tracker</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
          {totalCount.toLocaleString()} live coral listings across {vendors.length} vendors
        </p>
      </div>

      {/* Search + filter bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search corals by name..."
            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors text-sm"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
              <X size={14} />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(f => !f)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
            showFilters || activeFilters.length > 0
              ? 'bg-cyan-500 border-cyan-500 text-white'
              : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-500'
          }`}
        >
          <SlidersHorizontal size={15} />
          Filters
          {activeFilters.length > 0 && (
            <span className="bg-white/20 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
              {activeFilters.length}
            </span>
          )}
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl p-5 space-y-5">
          {/* Coral group */}
          <div>
            <label className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider mb-2.5 block">Coral Type</label>
            <div className="flex flex-wrap gap-2">
              {CORAL_GROUPS.map(g => (
                <button
                  key={g}
                  onClick={() => setGroup(g)}
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    group === g ? 'bg-cyan-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Price range */}
          <div>
            <label className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider mb-2.5 block">Price Range</label>
            <div className="flex flex-wrap gap-2">
              {PRICE_RANGES.map((r, i) => (
                <button
                  key={r.label}
                  onClick={() => setPriceRange(i)}
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    priceRange === i ? 'bg-cyan-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Vendor */}
          <div>
            <label className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider mb-2.5 block">Vendor</label>
            <div className="relative w-64">
              <button
                onClick={() => setVendorOpen(v => !v)}
                className="w-full flex items-center justify-between bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white hover:border-slate-400 dark:hover:border-slate-500 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Store size={14} className="text-slate-500 dark:text-slate-400" />
                  {vendorFilter}
                </span>
                <ChevronDown size={14} className={`text-slate-500 dark:text-slate-400 transition-transform ${vendorOpen ? 'rotate-180' : ''}`} />
              </button>
              {vendorOpen && (
                <div className="absolute top-full mt-1 left-0 right-0 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl overflow-hidden z-20 shadow-xl max-h-52 overflow-y-auto">
                  {['All', ...vendors].map(v => (
                    <button
                      key={v}
                      onClick={() => { setVendorFilter(v); setVendorOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                        vendorFilter === v ? 'text-cyan-400 bg-slate-200 dark:bg-slate-700' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sort */}
          <div>
            <label className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider mb-2.5 block">Sort By</label>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'scraped_at', label: 'Newest First' },
                { key: 'name_asc', label: 'Name A–Z' },
                { key: 'name_desc', label: 'Name Z–A' },
                { key: 'price_asc', label: 'Price: Low to High' },
                { key: 'price_desc', label: 'Price: High to Low' },
              ].map(s => (
                <button
                  key={s.key}
                  onClick={() => setSortBy(s.key as typeof sortBy)}
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    sortBy === s.key ? 'bg-cyan-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {activeFilters.length > 0 && (
            <button
              onClick={() => { setGroup('All'); setPriceRange(0); setVendorFilter('All'); setSortBy('scraped_at'); }}
              className="text-sm text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1.5"
            >
              <X size={13} /> Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Active filter chips */}
      {activeFilters.length > 0 && !showFilters && (
        <div className="flex flex-wrap gap-2">
          {activeFilters.map(f => (
            <span key={f} className="flex items-center gap-1.5 bg-cyan-100 dark:bg-cyan-900/30 border border-cyan-300 dark:border-cyan-700/40 text-cyan-700 dark:text-cyan-300 rounded-lg px-3 py-1 text-xs font-medium">
              <Tag size={11} />
              {f}
            </span>
          ))}
        </div>
      )}

      {/* Sort bar */}
      {!loading && products.length > 0 && (
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 dark:text-slate-500 flex items-center gap-1.5 mr-1">
            <ArrowUpDown size={12} />
            Sort:
          </span>
          {([
            { key: 'scraped_at', label: 'Newest' },
            { key: 'name_asc', label: 'Name A–Z', icon: <ArrowUp size={11} /> },
            { key: 'name_desc', label: 'Name Z–A', icon: <ArrowDown size={11} /> },
            { key: 'price_asc', label: 'Price Low', icon: <ArrowUp size={11} /> },
            { key: 'price_desc', label: 'Price High', icon: <ArrowDown size={11} /> },
          ] as { key: typeof sortBy; label: string; icon?: ReactNode }[]).map(s => (
            <button
              key={s.key}
              onClick={() => setSortBy(s.key)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium transition-all ${
                sortBy === s.key
                  ? 'bg-cyan-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {s.icon}
              {s.label}
            </button>
          ))}
        </div>
      )}

      {/* Product list */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex items-center gap-4 animate-pulse">
              <div className="w-14 h-14 rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-2/3" />
                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/3" />
              </div>
              <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-16 shrink-0" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 text-slate-400 dark:text-slate-500">
          <Search size={36} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No products found</p>
          <p className="text-sm mt-1">Try adjusting your filters or search</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {products.map(p => {
            const discount = getDiscount(p.price, p.compare_at_price);
            return (
              <a
                key={p.id}
                href={p.product_url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition-all duration-150"
              >
                {/* Thumbnail */}
                <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 relative">
                  {p.image_url ? (
                    <img
                      src={p.image_url}
                      alt={p.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-700">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/></svg>
                    </div>
                  )}
                </div>

                {/* Title + vendor */}
                <div className="flex-1 min-w-0">
                  <p className="text-slate-900 dark:text-white text-sm font-medium truncate">{p.title}</p>
                  <p className="text-slate-400 dark:text-slate-500 text-xs mt-0.5">{p.vendor_name}</p>
                </div>

                {/* Price + discount + link */}
                <div className="flex items-center gap-3 shrink-0">
                  {discount && (
                    <span className="bg-red-500/15 text-red-400 text-xs font-semibold px-2 py-0.5 rounded-md">
                      -{discount}%
                    </span>
                  )}
                  <div className="text-right">
                    <div className="text-slate-900 dark:text-white font-bold text-sm">${Number(p.price).toFixed(2)}</div>
                    {p.compare_at_price && Number(p.compare_at_price) > Number(p.price) && (
                      <div className="text-slate-400 dark:text-slate-500 text-xs line-through">${Number(p.compare_at_price).toFixed(2)}</div>
                    )}
                  </div>
                  <ExternalLink size={14} className="text-slate-400 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 transition-colors" />
                </div>
              </a>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalCount > PAGE_SIZE && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-slate-400 dark:text-slate-500 text-sm">
            Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, totalCount)} of {totalCount.toLocaleString()}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-sm disabled:opacity-40 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Prev
            </button>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={(page + 1) * PAGE_SIZE >= totalCount}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-sm disabled:opacity-40 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
