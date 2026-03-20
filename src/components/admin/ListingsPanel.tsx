import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Search, RefreshCw, Lock, Unlock, Trash2, RotateCcw,
  ChevronDown, ChevronUp, Flag, Eye, Package, MapPin,
  Truck, Tag, CheckCircle, AlertTriangle, ArrowUpDown,
} from 'lucide-react';

type ListingStatus = 'active' | 'sold' | 'traded' | 'expired' | 'removed';
type StatusFilter = 'all' | ListingStatus | 'locked';
type SortField = 'created_at' | 'views' | 'title';
type SortDir = 'asc' | 'desc';

interface Listing {
  id: string;
  title: string;
  description: string | null;
  status: ListingStatus;
  listing_type: string;
  asking_price: number | null;
  frag_size: string | null;
  is_shipping_available: boolean;
  is_local_pickup: boolean;
  is_locked: boolean;
  is_wysiwyg: boolean;
  is_aquacultured: boolean;
  location_city: string | null;
  location_state: string | null;
  views: number;
  created_at: string;
  seller?: { username: string; display_name: string | null };
  flag_count?: number;
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  sold: 'Sold',
  traded: 'Traded',
  expired: 'Expired',
  removed: 'Removed',
};

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400',
  sold: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400',
  traded: 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-400',
  expired: 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400',
  removed: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400',
};

const TYPE_STYLES: Record<string, string> = {
  sale: 'bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400',
  trade: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
  both: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400',
};

const FILTER_TABS: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'locked', label: 'Locked' },
  { id: 'removed', label: 'Removed' },
  { id: 'sold', label: 'Sold' },
  { id: 'expired', label: 'Expired' },
];

export default function ListingsPanel() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    loadListings();
  }, [sortField, sortDir]);

  async function loadListings() {
    setLoading(true);
    const { data } = await supabase
      .from('listings')
      .select('id, title, description, status, listing_type, asking_price, frag_size, is_shipping_available, is_local_pickup, is_locked, is_wysiwyg, is_aquacultured, location_city, location_state, views, created_at, seller:seller_id(username, display_name)')
      .order(sortField, { ascending: sortDir === 'asc' })
      .limit(200);

    const rows = (data ?? []) as Listing[];

    const { data: flagData } = await supabase
      .from('flags')
      .select('listing_id')
      .in('listing_id', rows.map(r => r.id))
      .eq('is_resolved', false);

    const flagMap: Record<string, number> = {};
    (flagData ?? []).forEach(f => {
      if (f.listing_id) flagMap[f.listing_id] = (flagMap[f.listing_id] ?? 0) + 1;
    });

    const enriched = rows.map(r => ({ ...r, flag_count: flagMap[r.id] ?? 0 }));
    setListings(enriched);

    const c: Record<string, number> = { all: enriched.length, locked: 0 };
    enriched.forEach(r => {
      c[r.status] = (c[r.status] ?? 0) + 1;
      if (r.is_locked) c.locked++;
    });
    setCounts(c);
    setLoading(false);
  }

  async function setStatus(id: string, status: ListingStatus) {
    setActionLoading(id + '_status');
    const { error } = await supabase.from('listings').update({ status }).eq('id', id);
    setActionLoading(null);
    if (error) showToast('Failed to update status', 'error');
    else { showToast(`Listing ${status === 'removed' ? 'removed' : 'restored'}`, 'success'); loadListings(); }
  }

  async function toggleLock(id: string, current: boolean) {
    setActionLoading(id + '_lock');
    const { error } = await supabase.from('listings').update({ is_locked: !current }).eq('id', id);
    setActionLoading(null);
    if (error) showToast('Failed to update lock', 'error');
    else { showToast(current ? 'Listing unlocked' : 'Listing locked', 'success'); loadListings(); }
  }

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  }

  const filtered = listings.filter(l => {
    const seller = l.seller as { username: string } | undefined;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      l.title.toLowerCase().includes(q) ||
      (seller?.username ?? '').toLowerCase().includes(q) ||
      (l.location_state ?? '').toLowerCase().includes(q);

    const matchStatus = statusFilter === 'all'
      ? true
      : statusFilter === 'locked'
        ? l.is_locked
        : l.status === statusFilter;

    return matchSearch && matchStatus;
  });

  const SortBtn = ({ field, label }: { field: SortField; label: string }) => (
    <button
      onClick={() => toggleSort(field)}
      className="flex items-center gap-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors text-xs font-medium"
    >
      {label}
      <ArrowUpDown size={11} className={sortField === field ? 'text-red-400' : ''} />
    </button>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by title, seller, or state..."
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all"
          />
        </div>
        <button
          onClick={loadListings}
          className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all self-center"
          title="Refresh"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {FILTER_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              statusFilter === tab.id
                ? 'bg-red-500 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {tab.id === 'locked' && <Lock size={10} />}
            {tab.label}
            {counts[tab.id] !== undefined && (
              <span className={`text-xs rounded-full px-1.5 font-bold ${statusFilter === tab.id ? 'bg-white/20' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}`}>
                {counts[tab.id] ?? 0}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="hidden sm:flex items-center gap-4 px-4 py-2 text-xs border-b border-slate-100 dark:border-slate-800">
        <div className="flex-1">
          <SortBtn field="title" label="Title" />
        </div>
        <div className="w-20 text-center"><SortBtn field="views" label="Views" /></div>
        <div className="w-24 text-right"><SortBtn field="created_at" label="Created" /></div>
        <div className="w-28" />
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
          <Package size={28} className="text-slate-400 dark:text-slate-600 mx-auto mb-2" />
          <p className="text-slate-400 dark:text-slate-500 text-sm">No listings found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(listing => {
            const seller = listing.seller as { username: string; display_name: string | null } | undefined;
            const isExpanded = expandedId === listing.id;
            const isActing = actionLoading?.startsWith(listing.id);

            return (
              <div key={listing.id} className={`bg-white dark:bg-slate-900 border rounded-xl transition-all duration-200 overflow-hidden ${
                listing.is_locked
                  ? 'border-amber-300 dark:border-amber-700/60'
                  : listing.status === 'removed'
                    ? 'border-red-200 dark:border-red-900/50 opacity-70'
                    : 'border-slate-200 dark:border-slate-800'
              }`}>
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-slate-900 dark:text-white text-sm font-medium line-clamp-1">{listing.title}</span>
                      {listing.is_locked && (
                        <span className="flex items-center gap-0.5 text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded-full">
                          <Lock size={10} />
                          Locked
                        </span>
                      )}
                      {(listing.flag_count ?? 0) > 0 && (
                        <span className="flex items-center gap-0.5 text-xs bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded-full">
                          <Flag size={10} />
                          {listing.flag_count}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-slate-400 dark:text-slate-500 text-xs">@{seller?.username}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_STYLES[listing.status] ?? ''}`}>
                        {STATUS_LABELS[listing.status] ?? listing.status}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${TYPE_STYLES[listing.listing_type] ?? ''}`}>
                        {listing.listing_type}
                      </span>
                      {listing.asking_price != null && (
                        <span className="text-xs text-slate-500 dark:text-slate-400">${listing.asking_price}</span>
                      )}
                    </div>
                  </div>

                  <div className="hidden sm:flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500 w-20 justify-center">
                    <Eye size={12} />
                    {listing.views}
                  </div>

                  <div className="hidden sm:block text-xs text-slate-400 dark:text-slate-500 w-24 text-right">
                    {new Date(listing.created_at).toLocaleDateString()}
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => toggleLock(listing.id, listing.is_locked)}
                      disabled={!!isActing}
                      title={listing.is_locked ? 'Unlock listing' : 'Lock listing'}
                      className={`p-1.5 rounded-lg transition-all disabled:opacity-50 ${
                        listing.is_locked
                          ? 'text-amber-500 hover:bg-amber-500/10'
                          : 'text-slate-400 hover:text-amber-500 hover:bg-amber-500/10'
                      }`}
                    >
                      {listing.is_locked ? <Unlock size={14} /> : <Lock size={14} />}
                    </button>

                    {listing.status === 'removed' ? (
                      <button
                        onClick={() => setStatus(listing.id, 'active')}
                        disabled={!!isActing}
                        title="Restore listing"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-emerald-500/10 transition-all disabled:opacity-50"
                      >
                        <RotateCcw size={14} />
                      </button>
                    ) : (
                      <button
                        onClick={() => setStatus(listing.id, 'removed')}
                        disabled={!!isActing}
                        title="Remove listing"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-all disabled:opacity-50"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}

                    <button
                      onClick={() => setExpandedId(isExpanded ? null : listing.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                    >
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-slate-100 dark:border-slate-800 px-4 py-4 space-y-3 bg-slate-50 dark:bg-slate-900/50">
                    {listing.description && (
                      <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{listing.description}</p>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {listing.frag_size && (
                        <span className="flex items-center gap-1 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 px-2.5 py-1 rounded-full">
                          <Tag size={10} />
                          {listing.frag_size}
                        </span>
                      )}
                      {(listing.location_city || listing.location_state) && (
                        <span className="flex items-center gap-1 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 px-2.5 py-1 rounded-full">
                          <MapPin size={10} />
                          {[listing.location_city, listing.location_state].filter(Boolean).join(', ')}
                        </span>
                      )}
                      {listing.is_shipping_available && (
                        <span className="flex items-center gap-1 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 px-2.5 py-1 rounded-full">
                          <Truck size={10} />
                          Ships
                        </span>
                      )}
                      {listing.is_wysiwyg && (
                        <span className="text-xs bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 text-cyan-600 dark:text-cyan-400 px-2.5 py-1 rounded-full">WYSIWYG</span>
                      )}
                      {listing.is_aquacultured && (
                        <span className="text-xs bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-full">Aquacultured</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-slate-400 dark:text-slate-600 text-xs">ID: {listing.id}</span>
                      <div className="flex gap-2">
                        {listing.status !== 'removed' && (
                          <button
                            onClick={() => { setStatus(listing.id, 'removed'); setExpandedId(null); }}
                            disabled={!!isActing}
                            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 transition-all disabled:opacity-50"
                          >
                            <Trash2 size={12} />
                            Remove
                          </button>
                        )}
                        {listing.status === 'removed' && (
                          <button
                            onClick={() => { setStatus(listing.id, 'active'); setExpandedId(null); }}
                            disabled={!!isActing}
                            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20 transition-all disabled:opacity-50"
                          >
                            <RotateCcw size={12} />
                            Restore
                          </button>
                        )}
                        <button
                          onClick={() => toggleLock(listing.id, listing.is_locked)}
                          disabled={!!isActing}
                          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all disabled:opacity-50 ${
                            listing.is_locked
                              ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/20'
                              : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {listing.is_locked ? <><Unlock size={12} /> Unlock</> : <><Lock size={12} /> Lock</>}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <p className="text-slate-400 dark:text-slate-600 text-xs text-center">
        Showing {filtered.length} of {listings.length} listings
      </p>

      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-sm font-medium text-white ${
          toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
        }`}>
          {toast.type === 'success' ? <CheckCircle size={15} /> : <AlertTriangle size={15} />}
          {toast.message}
        </div>
      )}
    </div>
  );
}
