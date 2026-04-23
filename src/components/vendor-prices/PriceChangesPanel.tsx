import { useState, useEffect, useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, ExternalLink, Calendar, PackageX } from 'lucide-react';
import { supabase, VendorPriceHistory, VendorScrapeConfig } from '../../lib/supabase';
import PriceHistoryChart from './PriceHistoryChart';


interface PriceChangesPanelProps {
  vendor: VendorScrapeConfig;
}

type ChangeFilter = 'all' | 'increases' | 'decreases' | 'new';

interface ProductHistory {
  shopify_id: number;
  handle: string;
  title: string;
  latestPrice: number;
  firstPrice: number;
  totalChange: number;
  totalChangePct: number | null;
  snapshots: VendorPriceHistory[];
  isNew: boolean;
  isUnavailable: boolean;
  imageUrl: string | null;
}

export default function PriceChangesPanel({ vendor }: PriceChangesPanelProps) {
  const [history, setHistory] = useState<VendorPriceHistory[]>([]);
  const [imageMap, setImageMap] = useState<Map<number, string>>(new Map());
  const [unavailableSet, setUnavailableSet] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ChangeFilter>('all');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadHistory();
  }, [vendor.slug]);

  async function loadHistory() {
    setLoading(true);
    const PAGE = 1000;
    let all: VendorPriceHistory[] = [];
    let from = 0;
    while (true) {
      const { data, error } = await supabase
        .from('vendor_price_history')
        .select('*')
        .eq('vendor_slug', vendor.slug)
        .order('recorded_at', { ascending: true })
        .range(from, from + PAGE - 1);
      if (error || !data || data.length === 0) break;
      all = all.concat(data);
      if (data.length < PAGE) break;
      from += PAGE;
    }
    setHistory(all);

    const { data: products } = await supabase
      .from('vendor_products')
      .select('shopify_id, image_url, is_available')
      .eq('vendor_slug', vendor.slug);
    if (products) {
      const map = new Map<number, string>();
      const unavail = new Set<number>();
      for (const p of products) {
        if (p.image_url) map.set(p.shopify_id, p.image_url);
        if (p.is_available === false) unavail.add(p.shopify_id);
      }
      setImageMap(map);
      setUnavailableSet(unavail);
    }

    setLoading(false);
  }

  const grouped = useMemo(() => {
    const map = new Map<number, VendorPriceHistory[]>();
    for (const h of history) {
      const arr = map.get(h.shopify_id) ?? [];
      arr.push(h);
      map.set(h.shopify_id, arr);
    }
    const products: ProductHistory[] = [];
    map.forEach((snaps, id) => {
      const sorted = [...snaps].sort(
        (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
      );
      const first = sorted[0];
      const latest = sorted[sorted.length - 1];
      const totalChange = latest.price - first.price;
      const totalChangePct = first.price > 0
        ? Math.round((totalChange / first.price) * 10000) / 100
        : null;
      products.push({
        shopify_id: id,
        handle: latest.handle,
        title: latest.title,
        latestPrice: latest.price,
        firstPrice: first.price,
        totalChange,
        totalChangePct,
        snapshots: sorted,
        isNew: sorted.length === 1 && first.price_change === null,
        isUnavailable: unavailableSet.has(id),
        imageUrl: imageMap.get(id) ?? null,
      });
    });
    return products;
  }, [history, imageMap, unavailableSet]);

  const filtered = useMemo(() => grouped
    .filter(p => {
      if (filter === 'increases') return !p.isNew && p.totalChange > 0.01;
      if (filter === 'decreases') return !p.isNew && p.totalChange < -0.01;
      if (filter === 'new') return p.isNew;
      return true;
    })
    .filter(p => !search || p.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => Math.abs(b.totalChange) - Math.abs(a.totalChange)),
  [grouped, filter, search]);

  useEffect(() => { setPage(0); }, [filter, search, pageSize, vendor.slug]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice(page * pageSize, (page + 1) * pageSize);

  const increases = useMemo(() => grouped.filter(p => !p.isNew && p.totalChange > 0.01).length, [grouped]);
  const decreases = useMemo(() => grouped.filter(p => !p.isNew && p.totalChange < -0.01).length, [grouped]);
  const newCount = useMemo(() => grouped.filter(p => p.isNew).length, [grouped]);
  const unchanged = grouped.length - increases - decreases - newCount;

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="columns-1 sm:columns-2 gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="break-inside-avoid mb-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 animate-pulse h-16" />
        ))}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl transition-colors duration-200">
        <Calendar size={36} className="mx-auto mb-3 text-slate-400 dark:text-slate-600" />
        <p className="text-slate-900 dark:text-white font-semibold mb-1">No price history yet</p>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Fetch prices at least once to start recording history. Changes will be tracked each time you refresh.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Price Increases', value: increases, color: 'text-red-400', bg: 'bg-red-900/20 border-red-800/40' },
          { label: 'Price Decreases', value: decreases, color: 'text-green-400', bg: 'bg-green-900/20 border-green-800/40' },
          { label: 'New Products', value: newCount, color: 'text-cyan-400', bg: 'bg-cyan-900/20 border-cyan-800/40' },
          { label: 'Unchanged', value: unchanged, color: 'text-slate-500 dark:text-slate-400', bg: 'bg-slate-100/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700' },
        ].map(stat => (
          <div key={stat.label} className={`${stat.bg} border rounded-xl px-4 py-3 transition-colors duration-200`}>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        {(['all', 'increases', 'decreases', 'new'] as ChangeFilter[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all capitalize ${
              filter === f
                ? 'bg-cyan-500 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {f === 'all' ? `All (${grouped.length})` :
             f === 'increases' ? `Increases (${increases})` :
             f === 'decreases' ? `Decreases (${decreases})` :
             `New (${newCount})`}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <select
            value={pageSize}
            onChange={e => setPageSize(Number(e.target.value))}
            className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-2 py-1.5 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 transition-colors text-xs"
          >
            <option value={50}>50 / page</option>
            <option value={100}>100 / page</option>
            <option value={200}>200 / page</option>
          </select>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search products..."
            className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors text-xs w-44"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-10 text-slate-400 dark:text-slate-500 text-sm">No matching products</div>
      ) : (
        <div className="columns-1 sm:columns-2 gap-2">
          {paged.map(product => {
            const isExpanded = expandedId === product.shopify_id;
            const isUp = product.totalChange > 0.01;
            const isDown = product.totalChange < -0.01;

            return (
              <div
                key={product.shopify_id}
                className={`break-inside-avoid mb-2 border rounded-xl overflow-hidden transition-colors duration-200 ${
                  product.isUnavailable
                    ? 'bg-slate-50 dark:bg-slate-900/60 border-slate-300/60 dark:border-slate-700/60'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                }`}
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : product.shopify_id)}
                  className="w-full text-left flex items-stretch hover:bg-slate-100/60 dark:hover:bg-slate-800/50 transition-colors"
                >
                  {product.imageUrl && !failedImages.has(product.shopify_id) ? (
                    <div className="shrink-0 w-14 overflow-hidden bg-slate-100 dark:bg-slate-800">
                      <img
                        src={product.imageUrl}
                        alt=""
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={() => setFailedImages(prev => new Set([...prev, product.shopify_id]))}
                      />
                    </div>
                  ) : (
                    <div className="shrink-0 flex items-center pl-4">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                        product.isNew ? 'bg-cyan-900/40' :
                        isUp ? 'bg-red-900/40' :
                        isDown ? 'bg-green-900/40' : 'bg-slate-100 dark:bg-slate-800'
                      }`}>
                        {product.isNew ? (
                          <span className="text-cyan-400 text-[9px] font-bold">NEW</span>
                        ) : isUp ? (
                          <TrendingUp size={13} className="text-red-400" />
                        ) : isDown ? (
                          <TrendingDown size={13} className="text-green-400" />
                        ) : (
                          <Minus size={13} className="text-slate-400 dark:text-slate-500" />
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex-1 min-w-0 flex items-center gap-3 px-3 py-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <p className={`text-sm font-medium truncate ${product.isUnavailable ? 'text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-white'}`}>{product.title}</p>
                        {product.isUnavailable && (
                          <span title="No longer listed at this vendor" className="shrink-0 flex items-center gap-1 bg-slate-200 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400 text-[9px] font-semibold px-1.5 py-0.5 rounded-md">
                            <PackageX size={9} />
                            UNLISTED
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                        <span>{product.snapshots.length} snapshot{product.snapshots.length !== 1 ? 's' : ''}</span>
                        <span>·</span>
                        <span>First seen {formatDate(product.snapshots[0].recorded_at)}</span>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-slate-900 dark:text-white font-semibold text-sm">${product.latestPrice.toFixed(2)}</p>
                      {!product.isNew && (
                        <p className={`text-xs font-medium ${isUp ? 'text-red-400' : isDown ? 'text-green-400' : 'text-slate-400 dark:text-slate-500'}`}>
                          {isUp ? '+' : ''}{product.totalChange.toFixed(2)}
                          {product.totalChangePct !== null && (
                            <span className="ml-1 opacity-70">({isUp ? '+' : ''}{product.totalChangePct}%)</span>
                          )}
                        </p>
                      )}
                    </div>

                    <a
                      href={`${vendor.base_url}/products/${product.handle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="shrink-0 text-slate-400 dark:text-slate-600 hover:text-cyan-400 transition-colors"
                    >
                      <ExternalLink size={13} />
                    </a>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-slate-200 dark:border-slate-800 pt-3 space-y-3">
                    {product.snapshots.length >= 2 && (
                      <PriceHistoryChart history={product.snapshots} title={product.title} />
                    )}
                    <div className="grid grid-cols-2 gap-x-3 max-h-48 overflow-y-auto">
                      {[...product.snapshots].reverse().map((snap, i) => (
                        <div key={snap.id} className="flex items-center justify-between text-xs py-1 border-b border-slate-200/50 dark:border-slate-800/50">
                          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 min-w-0">
                            <Calendar size={9} className="shrink-0" />
                            <span className="truncate">{formatDate(snap.recorded_at)}</span>
                            {i === 0 && (
                              <span className="bg-cyan-900/40 text-cyan-400 text-[8px] px-1 py-0.5 rounded shrink-0">•</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 shrink-0 ml-1">
                            {snap.price_change !== null && snap.price_change !== 0 && (
                              <span className={`text-[10px] ${snap.price_change > 0 ? 'text-red-400' : 'text-green-400'}`}>
                                {snap.price_change > 0 ? '+' : ''}{snap.price_change.toFixed(2)}
                              </span>
                            )}
                            <span className="text-slate-900 dark:text-white font-medium">${snap.price.toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span>Page {page + 1} of {totalPages}</span>
            <span className="text-slate-300 dark:text-slate-600">·</span>
            <span>{filtered.length} total</span>
          </div>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
