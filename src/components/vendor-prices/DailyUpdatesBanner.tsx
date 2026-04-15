import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Sparkles, TrendingUp, Store, Clock, ChevronDown, ChevronUp, CheckCircle, XCircle, AlertTriangle, ExternalLink } from 'lucide-react';

interface VendorStat {
  slug: string;
  name: string;
  publicUrl: string | null;
  newCount: number;
  updatedCount: number;
  status: 'completed' | 'error' | 'running' | 'none';
  completedAt: string | null;
}

interface Summary {
  totalVendors: number;
  totalNew: number;
  totalUpdated: number;
  errorCount: number;
  lastRunAt: string | null;
  vendorStats: VendorStat[];
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function DailyUpdatesBanner() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    async function load() {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const [runsRes, newProdRes, configsRes] = await Promise.all([
        supabase
          .from('vendor_scrape_runs')
          .select('vendor_slug, status, completed_at, products_inserted, products_updated, started_at')
          .gte('started_at', todayStart.toISOString())
          .order('started_at', { ascending: false }),
        supabase
          .from('vendor_products')
          .select('vendor_slug, first_seen_at')
          .gte('first_seen_at', since24h.toISOString()),
        supabase
          .from('vendor_scrape_configs')
          .select('slug, name, public_url')
          .eq('is_active', true),
      ]);

      const runs = runsRes.data ?? [];
      const newProds = newProdRes.data ?? [];
      const configs = configsRes.data ?? [];

      const nameMap = new Map(configs.map(c => [c.slug, c.name]));
      const urlMap = new Map(configs.map(c => [c.slug, c.public_url as string | null]));

      const newCountMap = new Map<string, number>();
      for (const p of newProds) {
        newCountMap.set(p.vendor_slug, (newCountMap.get(p.vendor_slug) ?? 0) + 1);
      }

      const latestRunMap = new Map<string, typeof runs[0]>();
      for (const run of runs) {
        if (!latestRunMap.has(run.vendor_slug)) {
          latestRunMap.set(run.vendor_slug, run);
        }
      }

      const updatedMap = new Map<string, number>();
      for (const run of runs) {
        if (run.status === 'completed') {
          updatedMap.set(run.vendor_slug, (updatedMap.get(run.vendor_slug) ?? 0) + (run.products_updated ?? 0));
        }
      }

      const vendorStats: VendorStat[] = [];
      for (const [slug, latest] of latestRunMap) {
        vendorStats.push({
          slug,
          name: nameMap.get(slug) ?? slug.replace(/-/g, ' '),
          publicUrl: urlMap.get(slug) ?? null,
          newCount: newCountMap.get(slug) ?? 0,
          updatedCount: updatedMap.get(slug) ?? 0,
          status: latest.status as VendorStat['status'],
          completedAt: latest.completed_at ?? null,
        });
      }

      vendorStats.sort((a, b) => (b.newCount + b.updatedCount) - (a.newCount + a.updatedCount));

      const latestRun = runs.reduce<string | null>((acc, r) => {
        if (!r.completed_at) return acc;
        return !acc || r.completed_at > acc ? r.completed_at : acc;
      }, null);

      setSummary({
        totalVendors: latestRunMap.size,
        totalNew: [...newCountMap.values()].reduce((s, c) => s + c, 0),
        totalUpdated: [...updatedMap.values()].reduce((s, c) => s + c, 0),
        errorCount: [...latestRunMap.values()].filter(r => r.status === 'error').length,
        lastRunAt: latestRun,
        vendorStats,
      });

      setLoading(false);
    }

    load();
  }, []);

  if (loading) {
    return (
      <div className="h-14 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl animate-pulse" />
    );
  }

  if (!summary || summary.totalVendors === 0) return null;

  const hasActivity = summary.totalNew > 0 || summary.totalUpdated > 0;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left"
      >
        <div className="flex items-center gap-2 mr-auto">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-900 dark:text-white font-semibold text-sm">Today's Update</span>
          </div>
          {summary.lastRunAt && (
            <span className="flex items-center gap-1 text-slate-400 dark:text-slate-500 text-xs">
              <Clock size={11} />
              {formatRelative(summary.lastRunAt)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Store size={13} className="text-slate-400 dark:text-slate-500" />
            <span className="text-slate-600 dark:text-slate-300 text-xs font-medium">
              {summary.totalVendors} stores scanned
            </span>
          </div>

          {summary.totalNew > 0 && (
            <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-0.5">
              <Sparkles size={11} className="text-emerald-400" />
              <span className="text-emerald-500 dark:text-emerald-400 text-xs font-semibold">
                +{summary.totalNew.toLocaleString()} new
              </span>
            </div>
          )}

          {summary.totalUpdated > 0 && (
            <div className="flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full px-2.5 py-0.5">
              <TrendingUp size={11} className="text-blue-400" />
              <span className="text-blue-500 dark:text-blue-400 text-xs font-semibold">
                {summary.totalUpdated.toLocaleString()} updated
              </span>
            </div>
          )}

          {summary.errorCount > 0 && (
            <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 rounded-full px-2.5 py-0.5">
              <AlertTriangle size={11} className="text-red-400" />
              <span className="text-red-400 text-xs font-semibold">
                {summary.errorCount} error{summary.errorCount !== 1 ? 's' : ''}
              </span>
            </div>
          )}

          {!hasActivity && summary.errorCount === 0 && (
            <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 text-xs">
              <CheckCircle size={12} className="text-emerald-400" />
              All up to date
            </div>
          )}
        </div>

        <div className="text-slate-400 dark:text-slate-500">
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 dark:border-slate-800 px-4 py-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
            {summary.vendorStats.map(v => (
              <div
                key={v.slug}
                className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 border ${
                  v.status === 'error'
                    ? 'bg-red-500/5 border-red-500/15 dark:border-red-500/20'
                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {v.status === 'completed' && <CheckCircle size={12} className="text-emerald-400 shrink-0" />}
                  {v.status === 'error' && <XCircle size={12} className="text-red-400 shrink-0" />}
                  {v.status === 'running' && <Clock size={12} className="text-amber-400 shrink-0 animate-spin" />}
                  {v.status === 'none' && <Store size={12} className="text-slate-400 shrink-0" />}
                  <span className="text-slate-700 dark:text-slate-300 text-xs font-medium truncate capitalize">
                    {v.name}
                  </span>
                  {v.publicUrl && (
                    <a
                      href={v.publicUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="shrink-0 text-slate-400 dark:text-slate-500 hover:text-cyan-400 transition-colors"
                      title={`Visit ${v.name} store`}
                    >
                      <ExternalLink size={10} />
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {v.newCount > 0 && (
                    <span className="text-emerald-500 text-xs font-bold">+{v.newCount}</span>
                  )}
                  {v.updatedCount > 0 && (
                    <span className="text-blue-400 text-xs">{v.updatedCount} upd</span>
                  )}
                  {v.newCount === 0 && v.updatedCount === 0 && v.status !== 'error' && (
                    <span className="text-slate-400 dark:text-slate-600 text-xs">no changes</span>
                  )}
                  {v.completedAt && (
                    <span className="text-slate-300 dark:text-slate-700 text-xs hidden sm:inline">
                      {new Date(v.completedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
