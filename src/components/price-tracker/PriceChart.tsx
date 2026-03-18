import { PriceHistory } from '../../lib/supabase';

interface PriceChartProps {
  history: PriceHistory[];
}

export default function PriceChart({ history }: PriceChartProps) {
  if (history.length < 2) return null;

  const sorted = [...history].sort((a, b) => new Date(a.sold_at).getTime() - new Date(b.sold_at).getTime());
  const prices = sorted.map(h => h.sale_price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const width = 600;
  const height = 120;
  const pad = { top: 10, right: 10, bottom: 24, left: 44 };
  const chartW = width - pad.left - pad.right;
  const chartH = height - pad.top - pad.bottom;

  const points = sorted.map((h, i) => ({
    x: pad.left + (i / Math.max(sorted.length - 1, 1)) * chartW,
    y: pad.top + (1 - (h.sale_price - min) / range) * chartH,
    price: h.sale_price,
    date: new Date(h.sold_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }));

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = `${pathD} L ${points[points.length - 1].x} ${pad.top + chartH} L ${points[0].x} ${pad.top + chartH} Z`;

  const trend = prices[prices.length - 1] > prices[0];
  const strokeColor = trend ? '#22c55e' : '#ef4444';

  const yTicks = [min, min + range / 2, max].map(v => ({
    value: v,
    y: pad.top + (1 - (v - min) / range) * chartH,
  }));

  const xTicks = [points[0], points[Math.floor(points.length / 2)], points[points.length - 1]].filter(Boolean);

  return (
    <div>
      <h4 className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider mb-3">Price History ({sorted.length} sales)</h4>
      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ minWidth: 280 }}>
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity={0.2} />
              <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {yTicks.map(tick => (
            <line
              key={tick.value}
              x1={pad.left}
              y1={tick.y}
              x2={pad.left + chartW}
              y2={tick.y}
              stroke="#334155"
              strokeDasharray="3,3"
              strokeWidth={0.5}
            />
          ))}

          {/* Y axis labels */}
          {yTicks.map(tick => (
            <text
              key={tick.value}
              x={pad.left - 6}
              y={tick.y}
              textAnchor="end"
              dominantBaseline="middle"
              fill="#64748b"
              fontSize={9}
            >
              ${tick.value.toFixed(0)}
            </text>
          ))}

          {/* X axis labels */}
          {xTicks.map(p => (
            <text
              key={p.x}
              x={p.x}
              y={height - 4}
              textAnchor="middle"
              fill="#64748b"
              fontSize={9}
            >
              {p.date}
            </text>
          ))}

          {/* Area fill */}
          <path d={areaD} fill="url(#areaGrad)" />

          {/* Line */}
          <path d={pathD} fill="none" stroke={strokeColor} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

          {/* Data points */}
          {points.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r={3} fill={strokeColor} />
              <title>${p.price} on {p.date}</title>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
