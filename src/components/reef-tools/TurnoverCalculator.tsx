import { useState } from 'react';
import { Wind } from 'lucide-react';

type TankType = 'mixed_reef' | 'sps_dominated' | 'lps_dominated' | 'fowlr';

const TANK_MULTIPLIERS: Record<TankType, { min: number; max: number; label: string; desc: string }> = {
  sps_dominated: { min: 40, max: 60, label: 'SPS Dominated', desc: 'High flow for SPS corals' },
  mixed_reef: { min: 25, max: 40, label: 'Mixed Reef', desc: 'Balanced flow for mixed corals' },
  lps_dominated: { min: 10, max: 20, label: 'LPS / Softies', desc: 'Moderate flow for LPS and softies' },
  fowlr: { min: 5, max: 10, label: 'FOWLR / Fish Only', desc: 'Light flow for fish-only systems' },
};

export default function TurnoverCalculator() {
  const [tankVol, setTankVol] = useState('');
  const [actualFlow, setActualFlow] = useState('');
  const [tankType, setTankType] = useState<TankType>('mixed_reef');

  const vol = parseFloat(tankVol);
  const flow = parseFloat(actualFlow);
  const cfg = TANK_MULTIPLIERS[tankType];

  const recMin = vol ? vol * cfg.min : null;
  const recMax = vol ? vol * cfg.max : null;
  const actualTurnover = vol && flow ? (flow / vol).toFixed(1) : null;

  function getStatus(): 'low' | 'ok' | 'high' | null {
    if (!vol || !flow) return null;
    const turnover = flow / vol;
    if (turnover < cfg.min) return 'low';
    if (turnover > cfg.max) return 'high';
    return 'ok';
  }

  const status = getStatus();
  const statusConfig = {
    low: { label: 'Too Low', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
    ok: { label: 'Ideal', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    high: { label: 'Too High', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
  };

  const inputCls = "w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors placeholder-slate-400 dark:placeholder-slate-500";
  const tabCls = (active: boolean) => `flex-1 py-2 rounded-lg text-xs font-medium text-center transition-all ${active ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 border border-slate-300 dark:border-slate-700'}`;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 transition-colors duration-200">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
          <Wind size={16} className="text-blue-400" />
        </div>
        <div>
          <h3 className="text-slate-900 dark:text-white font-semibold text-sm">Flow / Turnover Rate</h3>
          <p className="text-slate-400 dark:text-slate-500 text-xs">Check if your flow is right for your reef type</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        {(Object.entries(TANK_MULTIPLIERS) as [TankType, typeof TANK_MULTIPLIERS[TankType]][]).map(([k, v]) => (
          <button key={k} onClick={() => setTankType(k)} className={tabCls(tankType === k)}>
            {v.label}
          </button>
        ))}
      </div>

      <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">{cfg.desc} — {cfg.min}–{cfg.max}× turnover recommended</p>

      <div className="space-y-3">
        <div>
          <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block">Tank Volume (gallons)</label>
          <input className={inputCls} placeholder="100" value={tankVol} onChange={e => setTankVol(e.target.value)} type="number" min="0" />
        </div>

        {recMin && recMax && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 flex flex-wrap items-center justify-between gap-1">
            <span className="text-xs text-slate-700 dark:text-slate-300">Recommended flow</span>
            <span className="text-sm font-semibold text-blue-400 tabular-nums flex-shrink-0">
              {recMin.toLocaleString()} – {recMax.toLocaleString()} GPH
            </span>
          </div>
        )}

        <div>
          <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block">Your Total Flow (GPH)</label>
          <input className={inputCls} placeholder="2500" value={actualFlow} onChange={e => setActualFlow(e.target.value)} type="number" min="0" />
        </div>

        {actualTurnover && status && (
          <div className={`rounded-xl p-3 border ${statusConfig[status].bg} flex items-center justify-between`}>
            <div>
              <div className={`text-sm font-semibold ${statusConfig[status].color}`}>{statusConfig[status].label}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{actualTurnover}× turnover per hour</div>
            </div>
            <div className={`text-2xl font-bold ${statusConfig[status].color}`}>{actualTurnover}×</div>
          </div>
        )}
      </div>
    </div>
  );
}
