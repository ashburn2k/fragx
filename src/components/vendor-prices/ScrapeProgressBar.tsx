import { useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { RefreshCw, Package } from 'lucide-react';

interface ScrapeRun {
  status: string;
  products_found: number;
  error_message: string | null;
}

interface Props {
  vendorSlug: string;
  vendorName: string;
}

export default function ScrapeProgressBar({ vendorSlug, vendorName }: Props) {
  const [elapsed, setElapsed] = useState(0);
  const [run, setRun] = useState<ScrapeRun | null>(null);
  const startRef = useRef(Date.now());
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    startRef.current = Date.now();
    setElapsed(0);
    setRun(null);

    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);

    pollRef.current = setInterval(async () => {
      const { data } = await supabase
        .from('vendor_scrape_runs')
        .select('status, products_found, error_message')
        .eq('vendor_slug', vendorSlug)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) setRun(data);
    }, 2000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [vendorSlug]);

  const formatElapsed = (s: number) => {
    if (s < 60) return `${s}s`;
    return `${Math.floor(s / 60)}m ${s % 60}s`;
  };

  const productsFound = run?.products_found ?? 0;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 space-y-4 transition-colors duration-200">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
            <RefreshCw size={16} className="text-cyan-500 animate-spin" />
          </div>
          <div>
            <p className="text-slate-900 dark:text-white font-semibold text-sm">
              Scraping {vendorName}
            </p>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
              Fetching products from all collections
            </p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-slate-900 dark:text-white font-mono text-sm font-medium">
            {formatElapsed(elapsed)}
          </div>
          <div className="text-slate-400 dark:text-slate-500 text-xs">elapsed</div>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full w-full bg-gradient-to-r from-cyan-500 via-teal-400 to-cyan-500 rounded-full animate-[shimmer_1.8s_ease-in-out_infinite] bg-[length:200%_100%]" />
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 dark:text-slate-500">
            {run?.status === 'running' ? 'Scanning catalog...' : 'Starting up...'}
          </span>
          {productsFound > 0 && (
            <span className="flex items-center gap-1 text-cyan-600 dark:text-cyan-400 font-medium">
              <Package size={11} />
              {productsFound.toLocaleString()} found
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
