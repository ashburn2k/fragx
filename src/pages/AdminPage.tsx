import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Shield, Flag, ShoppingBag, Users, CheckCircle, XCircle, Eye, Image as ImageIcon, RefreshCw, Activity, Store, AlertTriangle } from 'lucide-react';
import UserControlPanel from '../components/admin/UserControlPanel';
import TradeModPanel from '../components/admin/TradeModPanel';
import ListingsPanel from '../components/admin/ListingsPanel';
import ScrapeReportPanel from '../components/admin/ScrapeReportPanel';

interface FlaggedItem {
  id: string;
  reason: string;
  notes: string | null;
  is_resolved: boolean;
  created_at: string;
  flagger_id: string;
  listing_id: string | null;
  listings?: { title: string; seller_id: string };
}

interface AdminStats {
  totalListings: number;
  activeListings: number;
  totalUsers: number;
  openFlags: number;
}

export default function AdminPage() {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState<AdminStats>({ totalListings: 0, activeListings: 0, totalUsers: 0, openFlags: 0 });
  const [flags, setFlags] = useState<FlaggedItem[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'flags' | 'listings' | 'users' | 'tools' | 'reports'>('overview');
  const [listingSubTab, setListingSubTab] = useState<'trade-listings' | 'have-want'>('trade-listings');
  const [loading, setLoading] = useState(true);
  const [cacheRunning, setCacheRunning] = useState(false);
  const [cacheResult, setCacheResult] = useState<{ enriched?: number; cached?: number; remaining?: number } | null>(null);
  const [scanAllRunning, setScanAllRunning] = useState(false);
  const [scanAllProgress, setScanAllProgress] = useState<{ current: number; total: number; vendorName: string } | null>(null);
  const [scanAllResults, setScanAllResults] = useState<{ succeeded: number; failed: number; vendors: { name: string; status: 'ok' | 'error'; error?: string }[] } | null>(null);
  const scanAllAbortRef = useRef(false);

  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    if (!user || !isAdmin) return;
    loadAdmin();
  }, [user, isAdmin]);

  async function loadAdmin() {
    setLoading(true);
    const [listingCount, activeCount, userCount, flagCount, flagsData] = await Promise.all([
      supabase.from('listings').select('id', { count: 'exact', head: true }),
      supabase.from('listings').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('flags').select('id', { count: 'exact', head: true }).eq('is_resolved', false),
      supabase.from('flags').select('*, listings(title, seller_id)').eq('is_resolved', false).order('created_at', { ascending: false }).limit(50),
    ]);

    setStats({
      totalListings: listingCount.count ?? 0,
      activeListings: activeCount.count ?? 0,
      totalUsers: userCount.count ?? 0,
      openFlags: flagCount.count ?? 0,
    });
    setFlags(flagsData.data ?? []);
    setLoading(false);
  }

  async function resolveFlag(id: string) {
    await supabase.from('flags').update({ is_resolved: true }).eq('id', id);
    loadAdmin();
  }

  async function runImageCache() {
    setCacheRunning(true);
    setCacheResult(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const res = await fetch(`${supabaseUrl}/functions/v1/cache-product-images`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token ?? anonKey}`,
          'Content-Type': 'application/json',
          'Apikey': anonKey,
        },
        body: JSON.stringify({ limit: 100, enrich_limit: 50 }),
      });
      const json = await res.json();
      if (json.success) {
        setCacheResult({
          enriched: json.null_image_enrichment?.enriched ?? 0,
          cached: (json.vendor_products?.cached ?? 0) + (json.wwc_products?.cached ?? 0),
          remaining: json.remaining_uncached ?? 0,
        });
      }
    } catch {
      setCacheResult(null);
    } finally {
      setCacheRunning(false);
    }
  }

  async function runScanAll() {
    scanAllAbortRef.current = false;
    setScanAllRunning(true);
    setScanAllResults(null);
    setScanAllProgress(null);

    const { data: vendors } = await supabase
      .from('vendor_scrape_configs')
      .select('slug, name')
      .eq('is_active', true)
      .order('name');

    if (!vendors || vendors.length === 0) {
      setScanAllRunning(false);
      return;
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const { data: { session } } = await supabase.auth.getSession();
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const token = session?.access_token ?? anonKey;

    const results: { name: string; status: 'ok' | 'error'; error?: string }[] = [];

    for (let i = 0; i < vendors.length; i++) {
      if (scanAllAbortRef.current) break;
      const v = vendors[i];
      setScanAllProgress({ current: i + 1, total: vendors.length, vendorName: v.name });

      try {
        const res = await fetch(`${supabaseUrl}/functions/v1/scrape-vendor-prices`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Apikey: anonKey,
          },
          body: JSON.stringify({ vendor_slug: v.slug, include_fish: true, force: true }),
        });
        const json = await res.json();
        if (json.success) {
          results.push({ name: v.name, status: 'ok' });
        } else {
          results.push({ name: v.name, status: 'error', error: json.error ?? 'Failed to start' });
        }
      } catch (err: unknown) {
        results.push({ name: v.name, status: 'error', error: err instanceof Error ? err.message : 'Network error' });
      }

      await new Promise(r => setTimeout(r, 500));
    }

    setScanAllResults({
      succeeded: results.filter(r => r.status === 'ok').length,
      failed: results.filter(r => r.status === 'error').length,
      vendors: results,
    });
    setScanAllProgress(null);
    setScanAllRunning(false);
  }

  function stopScanAll() {
    scanAllAbortRef.current = true;
    setScanAllRunning(false);
    setScanAllProgress(null);
  }

  if (!user || !isAdmin) return null;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-700 flex items-center justify-center">
          <Shield size={18} className="text-red-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Admin Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Moderation & platform management</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          { id: 'overview' as const, label: 'Overview' },
          { id: 'flags' as const, label: 'Flags', count: stats.openFlags },
          { id: 'listings' as const, label: 'Listings' },
          { id: 'users' as const, label: 'Users' },
          { id: 'reports' as const, label: 'Reports' },
          { id: 'tools' as const, label: 'Tools' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              activeTab === tab.id ? 'bg-red-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl h-24 animate-pulse" />)}
        </div>
      ) : (
        <>
          {activeTab === 'overview' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Total Listings', value: stats.totalListings, Icon: ShoppingBag, color: 'text-cyan-400' },
                  { label: 'Active Listings', value: stats.activeListings, Icon: Eye, color: 'text-emerald-400' },
                  { label: 'Registered Users', value: stats.totalUsers, Icon: Users, color: 'text-blue-400' },
                  { label: 'Open Flags', value: stats.openFlags, Icon: Flag, color: 'text-red-400' },
                ].map(({ label, value, Icon, color }) => (
                  <div key={label} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 transition-colors duration-200">
                    <Icon size={20} className={color} />
                    <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{value}</div>
                    <div className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">{label}</div>
                  </div>
                ))}
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 transition-colors duration-200">
                <h3 className="text-slate-900 dark:text-white font-semibold mb-3">Platform Health</h3>
                <div className="space-y-2">
                  {[
                    { label: 'Active listing rate', value: stats.totalListings > 0 ? Math.round((stats.activeListings / stats.totalListings) * 100) : 0, color: 'bg-cyan-500' },
                    { label: 'Flag resolution rate', value: stats.openFlags === 0 ? 100 : 70, color: 'bg-emerald-500' },
                  ].map(item => (
                    <div key={item.label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-500 dark:text-slate-400">{item.label}</span>
                        <span className="text-slate-900 dark:text-white font-medium">{item.value}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.value}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'flags' && (
            <div className="space-y-3">
              <p className="text-slate-500 dark:text-slate-400 text-sm">{stats.openFlags} open flags requiring review</p>
              {flags.filter(f => !f.is_resolved).length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
                  <CheckCircle size={32} className="text-emerald-500 mx-auto mb-3" />
                  <p className="text-emerald-400 font-medium">All clear!</p>
                  <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">No open flags to review</p>
                </div>
              ) : flags.filter(f => !f.is_resolved).map(flag => (
                <div key={flag.id} className="bg-white dark:bg-slate-900 border border-red-900/50 rounded-xl p-4 space-y-3 transition-colors duration-200">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Flag size={14} className="text-red-400" />
                        <span className="text-slate-900 dark:text-white font-medium text-sm capitalize">{flag.reason.replace('_', ' ')}</span>
                      </div>
                      {flag.listings && (
                        <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                          Listing: <span className="text-slate-700 dark:text-slate-300">{flag.listings.title}</span>
                        </p>
                      )}
                      {flag.notes && <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">"{flag.notes}"</p>}
                      <p className="text-slate-400 dark:text-slate-600 text-xs mt-1">{new Date(flag.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => resolveFlag(flag.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 py-2 rounded-xl text-xs font-medium transition-all"
                    >
                      <CheckCircle size={12} />
                      Resolve
                    </button>
                    {flag.listing_id && (
                      <button
                        onClick={async () => { await supabase.from('listings').update({ status: 'removed' }).eq('id', flag.listing_id!); loadAdmin(); }}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-900 py-2 rounded-xl text-xs font-medium transition-all"
                      >
                        <XCircle size={12} />
                        Remove Listing
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'listings' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                {[
                  { id: 'trade-listings' as const, label: 'Trade Listings' },
                  { id: 'have-want' as const, label: 'Have / Want Lists' },
                ].map(sub => (
                  <button
                    key={sub.id}
                    onClick={() => setListingSubTab(sub.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                      listingSubTab === sub.id
                        ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>
              {listingSubTab === 'trade-listings' && <ListingsPanel />}
              {listingSubTab === 'have-want' && <TradeModPanel />}
            </div>
          )}

          {activeTab === 'users' && <UserControlPanel />}

          {activeTab === 'reports' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                  <Activity size={15} className="text-cyan-400" />
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400 text-xs">Daily store scan activity, new items discovered, and any scrape errors</p>
                </div>
              </div>
              <ScrapeReportPanel />
            </div>
          )}

          {activeTab === 'tools' && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center flex-shrink-0">
                    <Store size={18} className="text-teal-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-slate-900 dark:text-white font-semibold text-sm">Scan All Stores</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 leading-relaxed">
                      Triggers a price scrape for every active vendor. Queues each store sequentially — scans run in the background so results appear in Reports once complete.
                    </p>

                    {scanAllProgress && (
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 dark:text-slate-400">
                            Queuing <span className="font-medium text-slate-700 dark:text-slate-300">{scanAllProgress.vendorName}</span>
                          </span>
                          <span className="text-slate-400 dark:text-slate-500 tabular-nums">{scanAllProgress.current} / {scanAllProgress.total}</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full transition-all duration-500"
                            style={{ width: `${Math.round((scanAllProgress.current / scanAllProgress.total) * 100)}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {scanAllResults && (
                      <div className="mt-3 space-y-2">
                        <div className="flex flex-wrap gap-2">
                          <span className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full">
                            {scanAllResults.succeeded} queued
                          </span>
                          {scanAllResults.failed > 0 && (
                            <span className="text-xs bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 px-3 py-1 rounded-full">
                              {scanAllResults.failed} failed
                            </span>
                          )}
                        </div>
                        {scanAllResults.vendors.filter(v => v.status === 'error').length > 0 && (
                          <div className="mt-2 space-y-1">
                            {scanAllResults.vendors.filter(v => v.status === 'error').map(v => (
                              <div key={v.name} className="flex items-start gap-2 text-xs text-red-400">
                                <AlertTriangle size={11} className="mt-0.5 shrink-0" />
                                <span><span className="font-medium">{v.name}:</span> {v.error}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 flex-shrink-0">
                    {scanAllRunning ? (
                      <button
                        onClick={stopScanAll}
                        className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 text-sm font-medium px-4 py-2 rounded-xl transition-all"
                      >
                        <XCircle size={14} />
                        Stop
                      </button>
                    ) : (
                      <button
                        onClick={runScanAll}
                        className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white text-sm font-medium px-4 py-2 rounded-xl transition-all"
                      >
                        <RefreshCw size={14} />
                        Run
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
                    <ImageIcon size={18} className="text-cyan-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-slate-900 dark:text-white font-semibold text-sm">Image Cache</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 leading-relaxed">
                      Fetches missing product images from vendor pages and caches them to Supabase storage. Processes up to 50 null-image products and 100 uncached external images per run.
                    </p>
                    {cacheResult && (
                      <div className="mt-3 flex flex-wrap gap-3">
                        <span className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full">
                          {cacheResult.enriched} images enriched
                        </span>
                        <span className="text-xs bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 px-3 py-1 rounded-full">
                          {cacheResult.cached} images cached
                        </span>
                        <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-3 py-1 rounded-full">
                          {cacheResult.remaining} remaining
                        </span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={runImageCache}
                    disabled={cacheRunning}
                    className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-xl transition-all flex-shrink-0"
                  >
                    <RefreshCw size={14} className={cacheRunning ? 'animate-spin' : ''} />
                    {cacheRunning ? 'Running...' : 'Run'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
