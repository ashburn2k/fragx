import { useEffect, useState, useCallback } from 'react';
import {
  Search, RefreshCw, ExternalLink, ChevronDown, SlidersHorizontal, X,
  TrendingDown, BarChart2, Clock
} from 'lucide-react';
import { supabase, WwcProduct, WwcScrapeRun } from '../lib/supabase';
import WwcPriceCard from '../components/price-tracker/WwcPriceCard';
import WwcPriceStats from '../components/price-tracker/WwcPriceStats';

const CORAL_COLLECTIONS = [
  'acropora', 'montipora', 'pocillopora', 'stylophora', 'birdsnest',
  'torch-coral', 'hammer-and-frogspawn', 'candy-cane-corals', 'chalices',
  'blastomussa', 'micromussa', 'duncan-corals', 'goniopora', 'mushroom-coral',
  'zoanthids', 'scolymia', 'trachyphyllia', 'lobophyllia', 'galaxea',
  'favia', 'favites', 'leptastrea', 'leptoseris', 'pavona', 'pectinia',
  'plate-coral', 'platygyra', 'bubble-coral', 'elegance', 'acanthophyllia',
  'alveopora', 'anacropora', 'astreopora', 'bowerbanki', 'cyphastrea',
  'cynarina', 'echinata', 'hydnophora', 'indophyllia', 'lithophyllon',
  'pachyseris', 'plesiastrea', 'porites', 'psammocora', 'stylocoeniella',
  'symphyllia', 'turbinaria',
];

const FISH_COLLECTIONS = [
  'clownfish-1', 'tangs', 'wrasses', 'gobies', 'blennies', 'damselfish-1',
  'anthias', 'basslet', 'cardinal-fish', 'firefish', 'hawkfish', 'dottyback',
  'dragonets', 'pygmy-angelfish', 'nano-fish',
];

type SortOption = 'price_asc' | 'price_desc' | 'newest' | 'title_asc';

const PAGE_SIZE = 48;

export default function WwcPricePage() {
  const [products, setProducts] = useState<WwcProduct[]>([]);
  const [filtered, setFiltered] = useState<WwcProduct[]>([]);
  const [displayed, setDisplayed] = useState<WwcProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);
  const [lastRun, setLastRun] = useState<WwcScrapeRun | null>(null);
  const [search, setSearch] = useState('');
  const [selectedCollection, setSelectedCollection] = useState('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [onSaleOnly, setOnSaleOnly] = useState(false);
  const [activeTab, setActiveTab] = useState<'coral' | 'fish'>('coral');
  const [page, setPage] = useState(1);
  const [showStats, setShowStats] = useState(false);

  const allCollections = activeTab === 'coral' ? CORAL_COLLECTIONS : FISH_COLLECTIONS;

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [productsRes, runRes] = await Promise.all([
      supabase.from('wwc_products').select('*').eq('is_available', true).order('scraped_at', { ascending: false }),
      supabase.from('wwc_scrape_runs').select('*').eq('status', 'completed').order('completed_at', { ascending: false }).limit(1).maybeSingle(),
    ]);
    setProducts(productsRes.data ?? []);
    setLastRun(runRes.data);
    setLoading(false);
  }

  const applyFilters = useCallback(() => {
    const tabCollections = activeTab === 'coral' ? CORAL_COLLECTIONS : FISH_COLLECTIONS;
    let result = products.filter(p => tabCollections.includes(p.collection));

    if (selectedCollection !== 'all') {
      result = result.filter(p => p.collection === selectedCollection);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.collection.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    if (priceMin) result = result.filter(p => p.price >= parseFloat(priceMin));
    if (priceMax) result = result.filter(p => p.price <= parseFloat(priceMax));
    if (onSaleOnly) result = result.filter(p => p.compare_at_price && p.compare_at_price > p.price);

    result.sort((a, b) => {
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      if (sortBy === 'title_asc') return a.title.localeCompare(b.title);
      return new Date(b.scraped_at).getTime() - new Date(a.scraped_at).getTime();
    });

    setFiltered(result);
    setPage(1);
  }, [products, search, selectedCollection, sortBy, priceMin, priceMax, onSaleOnly, activeTab]);

  useEffect(() => { applyFilters(); }, [applyFilters]);

  useEffect(() => {
    setDisplayed(filtered.slice(0, page * PAGE_SIZE));
  }, [filtered, page]);

  async function handleScrape() {
    setScraping(true);
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scrape-wwc-prices`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ include_fish: true }),
      });
      const data = await res.json();
      if (data.success) {
        await loadData();
      }
    } catch (err) {
      console.error('Scrape failed:', err);
    }
    setScraping(false);
  }

  function clearFilters() {
    setSearch('');
    setSelectedCollection('all');
    setPriceMin('');
    setPriceMax('');
    setOnSaleOnly(false);
    setSortBy('newest');
  }

  const hasActiveFilters = search || selectedCollection !== 'all' || priceMin || priceMax || onSaleOnly;

  const statsProducts = selectedCollection === 'all'
    ? filtered
    : filtered.filter(p => p.collection === selectedCollection);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">WWC Live Prices</h1>
            <a
              href="https://worldwidecorals.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-500 dark:text-slate-400 hover:text-cyan-400 transition-colors"
            >
              <ExternalLink size={16} />
            </a>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Real-time retail prices from WorldWideCoral
            {lastRun?.completed_at && (
              <span className="ml-2 inline-flex items-center gap-1 text-slate-400 dark:text-slate-500">
                <Clock size={11} />
                Updated {formatDate(lastRun.completed_at)}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowStats(s => !s)}
            className={`p-2 rounded-xl border transition-all duration-200 ${showStats ? 'border-cyan-500 text-cyan-400 bg-cyan-900/20' : 'border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
            title="Price statistics"
          >
            <BarChart2 size={16} />
          </button>
          <button
            onClick={handleScrape}
            disabled={scraping}
            className="bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-400 hover:to-teal-500 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-xl transition-all duration-200 flex items-center gap-2 text-sm"
          >
            <RefreshCw size={15} className={scraping ? 'animate-spin' : ''} />
            {scraping ? 'Scraping...' : 'Refresh Prices'}
          </button>
        </div>
      </div>

      {scraping && (
        <div className="bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-700/40 rounded-xl p-4 flex items-center gap-3">
          <RefreshCw size={16} className="animate-spin text-cyan-600 dark:text-cyan-400 shrink-0" />
          <div>
            <p className="text-cyan-700 dark:text-cyan-300 text-sm font-medium">Scraping WWC catalog...</p>
            <p className="text-cyan-600 dark:text-cyan-500 text-xs mt-0.5">Fetching prices from 60+ coral & fish collections. This may take a minute.</p>
          </div>
        </div>
      )}

      {products.length === 0 && !loading && !scraping && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-10 text-center transition-colors duration-200">
          <RefreshCw size={36} className="mx-auto mb-3 text-slate-400 dark:text-slate-600" />
          <p className="text-slate-900 dark:text-white font-semibold mb-1">No price data yet</p>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">Click "Refresh Prices" to scrape the latest prices from WorldWideCoral.</p>
          <button
            onClick={handleScrape}
            className="bg-gradient-to-r from-cyan-500 to-teal-600 text-white font-semibold px-6 py-2.5 rounded-xl transition-all"
          >
            Fetch Prices Now
          </button>
        </div>
      )}

      {products.length > 0 && (
        <>
          <div className="flex gap-2">
            {(['coral', 'fish'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setSelectedCollection('all'); }}
                className={`px-5 py-2 rounded-xl text-sm font-medium transition-all duration-200 capitalize ${
                  activeTab === tab ? 'bg-cyan-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab === 'coral' ? 'Corals' : 'Fish'}
              </button>
            ))}
          </div>

          {showStats && (
            <WwcPriceStats
              products={statsProducts}
              collection={selectedCollection === 'all' ? activeTab : selectedCollection}
            />
          )}

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, collection, or tag..."
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors text-sm"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white">
                  <X size={14} />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters(s => !s)}
              className={`px-3 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
                showFilters || hasActiveFilters
                  ? 'border-cyan-500 text-cyan-700 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/20'
                  : 'border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <SlidersHorizontal size={15} />
              Filter
              {hasActiveFilters && <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />}
            </button>
          </div>

          {showFilters && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-4 transition-colors duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1.5">Collection</label>
                  <div className="relative">
                    <select
                      value={selectedCollection}
                      onChange={e => setSelectedCollection(e.target.value)}
                      className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-cyan-500 appearance-none pr-8"
                    >
                      <option value="all">All Collections</option>
                      {allCollections.map(c => (
                        <option key={c} value={c}>{c.replace(/-/g, ' ')}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1.5">Price Range</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={priceMin}
                      onChange={e => setPriceMin(e.target.value)}
                      placeholder="Min $"
                      className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-cyan-500"
                    />
                    <span className="text-slate-400 dark:text-slate-500 text-sm">–</span>
                    <input
                      type="number"
                      value={priceMax}
                      onChange={e => setPriceMax(e.target.value)}
                      placeholder="Max $"
                      className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1.5">Sort By</label>
                  <div className="relative">
                    <select
                      value={sortBy}
                      onChange={e => setSortBy(e.target.value as SortOption)}
                      className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-cyan-500 appearance-none pr-8"
                    >
                      <option value="newest">Newest First</option>
                      <option value="price_asc">Price: Low to High</option>
                      <option value="price_desc">Price: High to Low</option>
                      <option value="title_asc">Name A–Z</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <div
                    onClick={() => setOnSaleOnly(s => !s)}
                    className={`w-9 h-5 rounded-full transition-colors cursor-pointer ${onSaleOnly ? 'bg-cyan-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                  >
                    <div className={`w-3.5 h-3.5 bg-white rounded-full mt-0.75 transition-transform ${onSaleOnly ? 'translate-x-4.5' : 'translate-x-0.75'} m-[3px]`} />
                  </div>
                  <span className="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <TrendingDown size={13} className="text-red-400" />
                    On sale only
                  </span>
                </label>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1">
                    <X size={12} /> Clear all filters
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500 dark:text-slate-400">
              {filtered.length.toLocaleString()} products
              {hasActiveFilters && <span className="text-slate-400 dark:text-slate-500"> (filtered)</span>}
            </span>
            {lastRun && (
              <span className="text-slate-400 dark:text-slate-500 text-xs">
                {lastRun.products_found.toLocaleString()} total in catalog
              </span>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {Array.from({ length: 24 }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden animate-pulse">
                  <div className="aspect-square bg-slate-100 dark:bg-slate-800" />
                  <div className="p-3 space-y-2">
                    <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded" />
                    <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-2/3" />
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : displayed.length === 0 ? (
            <div className="text-center py-16">
              <Search size={32} className="mx-auto mb-3 text-slate-400 dark:text-slate-600" />
              <p className="text-slate-500 dark:text-slate-400">No products match your filters</p>
              <button onClick={clearFilters} className="mt-3 text-cyan-400 hover:text-cyan-300 text-sm transition-colors">
                Clear filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {displayed.map(product => (
                  <WwcPriceCard key={product.id} product={product} />
                ))}
              </div>
              {displayed.length < filtered.length && (
                <div className="text-center pt-2">
                  <button
                    onClick={() => setPage(p => p + 1)}
                    className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white px-8 py-3 rounded-xl transition-colors text-sm font-medium"
                  >
                    Load more ({filtered.length - displayed.length} remaining)
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
