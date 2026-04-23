import { VendorPriceHistory } from '../../lib/supabase';

interface PriceHistoryChartProps {
  history: VendorPriceHistory[];
  title: string;
}

export default function PriceHistoryChart({ history, title }: PriceHistoryChartProps) {
  if (history.length < 2) return null;

  const sorted = [...history].sort(
    (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
  );

  const prices = sorted.map(h => h.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const W = 400;
  const H = 80;
  const PAD = 8;
  const innerW = W - PAD * 2;
  const innerH = H - PAD * 2;

  const pts = sorted.map((h, i) => {
    const x = PAD + (i / (sorted.length - 1)) * innerW;
    const y = PAD + (1 - (h.price - min) / range) * innerH;
    return { x, y, h };
  });

  const d = pts
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');

  const fill = `${d} L ${pts[pts.length - 1].x.toFixed(1)} ${H} L ${PAD} ${H} Z`;

  const latest = sorted[sorted.length - 1];
  const first = sorted[0];
  const totalChange = latest.price - first.price;
  const isUp = totalChange > 0;
  const isFlat = Math.abs(totalChange) < 0.01;

  return (
    <div className="bg-slate-100/60 dark:bg-slate-800/50 rounded-lg p-3 space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-500 dark:text-slate-400 truncate max-w-[60%]">{title}</span>
        <span className={`font-semibold ${isFlat ? 'text-slate-400' : isUp ? 'text-red-400' : 'text-green-400'}`}>
          {isFlat ? '—' : `${isUp ? '+' : ''}$${totalChange.toFixed(2)}`}
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-16">
        <defs>
          <linearGradient id={`grad-${sorted[0].id}-${sorted[0].shopify_id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isUp ? '#f87171' : '#34d399'} stopOpacity="0.3" />
            <stop offset="100%" stopColor={isUp ? '#f87171' : '#34d399'} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={fill} fill={`url(#grad-${sorted[0].id}-${sorted[0].shopify_id})`} />
        <path d={d} fill="none" stroke={isFlat ? '#64748b' : isUp ? '#f87171' : '#34d399'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="2" fill={isFlat ? '#64748b' : isUp ? '#f87171' : '#34d399'} />
        ))}
      </svg>
      <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500">
        <span>${min.toFixed(2)}</span>
        <span>{sorted.length} snapshots</span>
        <span>${max.toFixed(2)}</span>
      </div>
    </div>
  );
}
