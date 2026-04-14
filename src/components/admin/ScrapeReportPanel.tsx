import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import {
  RefreshCw, CheckCircle, AlertTriangle, Clock, ChevronDown, ChevronUp,
  Store, TrendingUp, Sparkles, XCircle, Calendar, Package, BarChart3,
  WifiOff, EyeOff, ExternalLink,
} from 'lucide-react';

interface ScrapeRun {
  id: string;
  vendor_slug: string;
  started_at: string;
  completed_at: string | null;
  products_found: number;
  products_inserted: number;
  products_updated: number;
  status: string;
  error_message: string | null;
}

interface DayGroup {
  date: string;
  runs: ScrapeRun[];
  totalFound: number;
  totalNew: number;
  totalUpdated: number;
  errorCount: number;
  vendorCount: number;
  hasErrors: boolean;
}

interface NewProductSummary {
  vendor_slug: string;
  count: number;
}

interface StaleVendor {
  slug: string;
  name: string;
  lastSuccessAt: string | null;
  daysSince: number | null;
}

const STALE_THRESHOLD_DAYS = 14;

function formatDuration(start: string, end: string | null): string {
  if (!end) return 'Running...';
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (ms < 1000) return `${ms}ms`;
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const dStr = d.toDateString();
  if (dStr === today.toDateString()) return 'Today';
  if (dStr === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function groupByDay(runs: ScrapeRun[]): DayGroup[] {
  const map = new Map<string, ScrapeRun[]>();
  for (const run of runs) {
    const key = new Date(run.started_at).toDateString();
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(run);
  }
  const groups: DayGroup[] = [];
  for (const [date, dayRuns] of map) {
    groups.push({
      date,
      runs: dayRuns,
      totalFound: dayRuns.reduce((s, r) => s + (r.products_found ?? 0), 0),
      totalNew: dayRuns.reduce((s, r) => s + (r.products_inserted ?? 0), 0),
      totalUpdated: dayRuns.reduce((s, r) => s + (r.products_updated ?? 0), 0),
      errorCount: dayRuns.filter(r => r.status === 'error').length,
      vendorCount: new Set(dayRuns.map(r => r.vendor_slug)).size,
      hasErrors: dayRuns.some(r => r.status === 'error'),
    });
  }
  return groups;
}

const STATUS_CONFIG: Record<string, { icon: React.ReactNode; classes: string; label: string }> = {
  completed: { icon: <CheckCircle size={12} />, classes: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', label: 'OK' },
  error: { icon: <XCircle size={12} />, classes: 'text-red-400 bg-red-500/10 border-red-500/20', label: 'Error' },
  running: { icon: <Clock size={12} />, classes: 'text-amber-400 bg-amber-500/10 border-amber-500/20', label: 'Running' },
};

export default function ScrapeReportPanel() {
  const [runs, setRuns] = useState<ScrapeRun[]>([]);
  const [newProducts, setNewProducts] = useState<NewProductSummary[]>([]);
  const [staleVendors, setStaleVendors] = useState<StaleVendor[]>([]);
  const [deactivating, setDeactivating] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [vendorUrls, setVendorUrls] = useState<Map<string, string>>(new Map());

  const load = useCallback(async () => {
    setLoading(true);
    const since30d = new Date();
    since30d.setDate(since30d.getDate() - 30);
    const since48h = new Date();
    since48h.setHours(since48h.getHours() - 48);

    const [runsRes, newProdRes, vendorConfigsRes] = await Promise.all([
      supabase
        .from('vendor_scrape_runs')
        .select('id, vendor_slug, started_at, completed_at, products_found, products_inserted, products_updated, status, error_message')
        .gte('started_at', since30d.toISOString())
        .order('started_at', { ascending: false })
        .limit(500),
      supabase
        .from('vendor_products')
        .select('vendor_slug, first_seen_at')
        .gte('first_seen_at', since48h.toISOString()),
      supabase
        .from('vendor_scrape_configs')
        .select('slug, name, public_url')
        .eq('is_active', true),
    ]);

    const fetchedRuns = runsRes.data ?? [];
    setRuns(fetchedRuns);

    if (newProdRes.data) {
      const countMap = new Map<string, number>();
      for (const p of newProdRes.data) {
        countMap.set(p.vendor_slug, (countMap.get(p.vendor_slug) ?? 0) + 1);
      }
      const sorted = [...countMap.entries()]
        .map(([vendor_slug, count]) => ({ vendor_slug, count }))
        .sort((a, b) => b.count - a.count);
      setNewProducts(sorted);
    }

    if (vendorConfigsRes.data) {
      const urlMap = new Map<string, string>();
      for (const v of vendorConfigsRes.data) {
        if (v.public_url) urlMap.set(v.slug, v.public_url);
      }
      setVendorUrls(urlMap);
      const lastSuccessMap = new Map<string, string | null>();
      for (const run of fetchedRuns) {
        if (run.status === 'completed' && run.completed_at) {
          const existing = lastSuccessMap.get(run.vendor_slug);
          if (!existing || run.completed_at > existing) {
            lastSuccessMap.set(run.vendor_slug, run.completed_at);
          }
        }
      }

      const now = Date.now();
      const stale: StaleVendor[] = [];
      for (const vendor of vendorConfigsRes.data) {
        const lastSuccess = lastSuccessMap.get(vendor.slug) ?? null;
        const daysSince = lastSuccess
          ? Math.floor((now - new Date(lastSuccess).getTime()) / 86400000)
          : null;
        if (daysSince === null || daysSince >= STALE_THRESHOLD_DAYS) {
          stale.push({ slug: vendor.slug, name: vendor.name, lastSuccessAt: lastSuccess, daysSince });
        }
      }
      stale.sort((a, b) => (b.daysSince ?? 999) - (a.daysSince ?? 999));
      setStaleVendors(stale);
    }

    setLoading(false);
  }, []);

  async function handleDeactivate(slug: string) {
    setDeactivating(slug);
    await supabase
      .from('vendor_scrape_configs')
      .update({ is_active: false })
      .eq('slug', slug);
    setStaleVendors(prev => prev.filter(v => v.slug !== slug));
    setDeactivating(null);
  }

  useEffect(() => {
    load();
  }, [load]);

  const groups = groupByDay(runs);

  const todayGroup = groups[0];
  const totalRecentNew = newProducts.reduce((s, n) => s + n.count, 0);

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-slate-900 dark:text-white font-semibold">Daily Scrape Reports</h3>
        <button
          onClick={load}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
        >
          <RefreshCw size={12} />
          Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <Store size={16} className="text-cyan-400 mb-2" />
          <div className="text-xl font-bold text-slate-900 dark:text-white">
            {todayGroup?.vendorCount ?? 0}
          </div>
          <div className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Vendors scanned today</div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <Package size={16} className="text-blue-400 mb-2" />
          <div className="text-xl font-bold text-slate-900 dark:text-white">
            {(todayGroup?.totalFound ?? 0).toLocaleString()}
          </div>
          <div className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Products scanned today</div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <Sparkles size={16} className="text-emerald-400 mb-2" />
          <div className="text-xl font-bold text-slate-900 dark:text-white">
            {totalRecentNew.toLocaleString()}
          </div>
          <div className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">New items (48h)</div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <AlertTriangle size={16} className="text-red-400 mb-2" />
          <div className="text-xl font-bold text-slate-900 dark:text-white">
            {todayGroup?.errorCount ?? 0}
          </div>
          <div className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Errors today</div>
        </div>
      </div>

      {/* Stale vendor alerts */}
      {staleVendors.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-amber-300/40 dark:border-amber-500/20 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <WifiOff size={14} className="text-amber-500" />
            <span className="text-slate-900 dark:text-white font-medium text-sm">
              Stale Vendors — No Successful Scrape in {STALE_THRESHOLD_DAYS}+ Days
            </span>
            <span className="ml-auto text-xs text-amber-500 font-semibold">
              {staleVendors.length} vendor{staleVendors.length !== 1 ? 's' : ''}
            </span>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
            These vendors have not returned a successful price scrape recently. Consider deactivating them to remove from the vendor tracking list. Their historical price data will be preserved.
          </p>
          <div className="space-y-2">
            {staleVendors.map(v => (
              <div
                key={v.slug}
                className="flex items-center justify-between gap-3 bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/15 rounded-lg px-3 py-2.5"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-slate-800 dark:text-slate-200 text-xs font-medium">{v.name}</span>
                    {vendorUrls.get(v.slug) && (
                      <a
                        href={vendorUrls.get(v.slug)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="flex items-center gap-1 text-xs text-cyan-500 hover:text-cyan-400 transition-colors"
                      >
                        <ExternalLink size={10} />
                        Store
                      </a>
                    )}
                    <span className="text-amber-600 dark:text-amber-400 text-xs">
                      {v.daysSince === null
                        ? 'Never successfully scraped'
                        : `Last success ${v.daysSince}d ago`}
                    </span>
                  </div>
                  {v.lastSuccessAt && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <Clock size={10} className="text-slate-400 dark:text-slate-500" />
                      <span className="text-slate-400 dark:text-slate-500 text-xs">
                        {new Date(v.lastSuccessAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleDeactivate(v.slug)}
                  disabled={deactivating === v.slug}
                  className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-100 dark:bg-amber-500/10 hover:bg-amber-200 dark:hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-medium transition-colors disabled:opacity-50"
                >
                  <EyeOff size={11} />
                  {deactivating === v.slug ? 'Hiding...' : 'Deactivate'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New products by vendor (last 48h) */}
      {newProducts.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-emerald-500/20 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-emerald-400" />
            <span className="text-slate-900 dark:text-white font-medium text-sm">
              New Catalog Entries — Last 48 Hours
            </span>
            <span className="ml-auto text-xs text-emerald-400 font-semibold">
              {totalRecentNew.toLocaleString()} total
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {newProducts.map(({ vendor_slug, count }) => (
              <div key={vendor_slug} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-slate-700 dark:text-slate-300 text-xs font-medium capitalize">
                    {vendor_slug.replace(/-/g, ' ')}
                  </span>
                  {vendorUrls.get(vendor_slug) && (
                    <a
                      href={vendorUrls.get(vendor_slug)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-cyan-500 hover:text-cyan-400 transition-colors shrink-0"
                    >
                      <ExternalLink size={10} />
                      Store
                    </a>
                  )}
                </div>
                <span className="text-emerald-500 text-xs font-bold shrink-0">+{count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Per-day run history */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 px-1">
          <Calendar size={12} />
          <span>Run history (last 30 days)</span>
        </div>

        {groups.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <BarChart3 size={28} className="text-slate-400 mx-auto mb-2" />
            <p className="text-slate-400 dark:text-slate-500 text-sm">No scrape runs recorded yet</p>
          </div>
        ) : (
          groups.map(group => {
            const isExpanded = expandedDay === group.date;
            const labelDate = formatDate(group.runs[0].started_at);

            return (
              <div
                key={group.date}
                className={`bg-white dark:bg-slate-900 border rounded-xl overflow-hidden transition-all duration-200 ${
                  group.hasErrors
                    ? 'border-red-200 dark:border-red-900/50'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <button
                  onClick={() => setExpandedDay(isExpanded ? null : group.date)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-slate-900 dark:text-white font-medium text-sm">{labelDate}</span>
                      {group.hasErrors && (
                        <span className="flex items-center gap-1 text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">
                          <AlertTriangle size={10} />
                          {group.errorCount} error{group.errorCount !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="text-slate-400 dark:text-slate-500 text-xs">{group.vendorCount} vendors</span>
                      <span className="text-slate-400 dark:text-slate-500 text-xs">{group.totalFound.toLocaleString()} found</span>
                      {group.totalNew > 0 && (
                        <span className="text-emerald-400 text-xs">+{group.totalNew.toLocaleString()} new</span>
                      )}
                      {group.totalUpdated > 0 && (
                        <span className="text-blue-400 text-xs">{group.totalUpdated.toLocaleString()} updated</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">{group.runs.length} runs</span>
                    {isExpanded ? (
                      <ChevronUp size={14} className="text-slate-400" />
                    ) : (
                      <ChevronDown size={14} className="text-slate-400" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-slate-100 dark:border-slate-800">
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {group.runs.map(run => {
                        const cfg = STATUS_CONFIG[run.status] ?? STATUS_CONFIG.running;
                        const duration = formatDuration(run.started_at, run.completed_at);
                        return (
                          <div key={run.id} className={`px-4 py-3 ${run.status === 'error' ? 'bg-red-500/5' : ''}`}>
                            <div className="flex items-start gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-slate-700 dark:text-slate-300 text-xs font-medium capitalize">
                                    {run.vendor_slug.replace(/-/g, ' ')}
                                  </span>
                                  {vendorUrls.get(run.vendor_slug) && (
                                    <a
                                      href={vendorUrls.get(run.vendor_slug)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1 text-xs text-cyan-500 hover:text-cyan-400 transition-colors"
                                    >
                                      <ExternalLink size={10} />
                                      Store
                                    </a>
                                  )}
                                  <span className={`flex items-center gap-1 text-xs border px-1.5 py-0.5 rounded-full ${cfg.classes}`}>
                                    {cfg.icon}
                                    {cfg.label}
                                  </span>
                                  <span className="text-slate-400 dark:text-slate-600 text-xs flex items-center gap-1">
                                    <Clock size={10} />
                                    {duration}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 mt-1 flex-wrap">
                                  <span className="text-slate-400 dark:text-slate-500 text-xs">
                                    {(run.products_found ?? 0).toLocaleString()} found
                                  </span>
                                  {(run.products_inserted ?? 0) > 0 && (
                                    <span className="text-emerald-400 text-xs font-medium">
                                      +{run.products_inserted} new
                                    </span>
                                  )}
                                  {(run.products_updated ?? 0) > 0 && (
                                    <span className="text-blue-400 text-xs">
                                      <TrendingUp size={10} className="inline mr-0.5" />
                                      {run.products_updated} updated
                                    </span>
                                  )}
                                  <span className="text-slate-400 dark:text-slate-600 text-xs">
                                    {new Date(run.started_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                {run.error_message && (
                                  <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                                    <p className="text-red-400 text-xs font-mono leading-relaxed break-all">
                                      {run.error_message}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
