import { useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Image as ImageIcon, X, CheckCircle } from 'lucide-react';

interface CacheStats {
  totalWithImages: number;
  cached: number;
  uncached: number;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

export default function ImageCacheProgressBanner() {
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);
  const prevUncached = useRef<number | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function fetchStats() {
    const storagePrefix = `${SUPABASE_URL}/storage/v1/object/public/vendor-images`;

    const [vendorTotal, vendorCached, wwcTotal, wwcCached] = await Promise.all([
      supabase
        .from('vendor_products')
        .select('id', { count: 'exact', head: true })
        .not('image_url', 'is', null),
      supabase
        .from('vendor_products')
        .select('id', { count: 'exact', head: true })
        .like('image_url', `${storagePrefix}%`),
      supabase
        .from('wwc_products')
        .select('id', { count: 'exact', head: true })
        .not('image_url', 'is', null),
      supabase
        .from('wwc_products')
        .select('id', { count: 'exact', head: true })
        .like('image_url', `${storagePrefix}%`),
    ]);

    const total = (vendorTotal.count ?? 0) + (wwcTotal.count ?? 0);
    const cached = (vendorCached.count ?? 0) + (wwcCached.count ?? 0);
    const uncached = total - cached;

    const next: CacheStats = { totalWithImages: total, cached, uncached };

    if (prevUncached.current !== null && prevUncached.current > 0 && uncached === 0) {
      setJustCompleted(true);
      completedTimerRef.current = setTimeout(() => {
        setJustCompleted(false);
        setDismissed(true);
      }, 4000);
    }

    prevUncached.current = uncached;
    setStats(next);
  }

  useEffect(() => {
    const initTimer = setTimeout(() => {
      fetchStats();
      pollRef.current = setInterval(fetchStats, 60000);
    }, 6000);
    return () => {
      clearTimeout(initTimer);
      if (pollRef.current) clearInterval(pollRef.current);
      if (completedTimerRef.current) clearTimeout(completedTimerRef.current);
    };
  }, []);

  if (dismissed || stats === null) return null;
  if (stats.uncached === 0 && !justCompleted) return null;

  const pct = stats.totalWithImages > 0
    ? Math.round((stats.cached / stats.totalWithImages) * 100)
    : 0;

  if (justCompleted) {
    return (
      <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700/50 rounded-xl px-4 py-3 transition-all duration-500">
        <CheckCircle size={15} className="text-emerald-500 shrink-0" />
        <p className="text-emerald-700 dark:text-emerald-400 text-sm font-medium flex-1">
          All product images cached successfully
        </p>
        <button onClick={() => setDismissed(true)} className="text-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-300 transition-colors shrink-0">
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/60 rounded-xl px-4 py-3 space-y-2.5 transition-colors duration-200">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
            <ImageIcon size={13} className="text-cyan-500" />
          </div>
          <div>
            <p className="text-slate-800 dark:text-slate-200 text-sm font-medium leading-tight">
              Caching product images
            </p>
            <p className="text-slate-400 dark:text-slate-500 text-xs mt-0.5">
              {stats.uncached.toLocaleString()} remaining &middot; {stats.cached.toLocaleString()} of {stats.totalWithImages.toLocaleString()} cached
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-slate-900 dark:text-white font-semibold text-sm tabular-nums">{pct}%</span>
          <button
            onClick={() => setDismissed(true)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>
      <div className="space-y-1">
        <div className="h-1.5 bg-slate-200 dark:bg-slate-700/60 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-teal-500 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500">
          <span>Runs automatically in the background</span>
          <span>{stats.cached.toLocaleString()} cached</span>
        </div>
      </div>
    </div>
  );
}
