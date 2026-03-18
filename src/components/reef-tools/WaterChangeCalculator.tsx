import { useState } from 'react';
import { Droplets } from 'lucide-react';

export default function WaterChangeCalculator() {
  const [tankVol, setTankVol] = useState('');
  const [changePercent, setChangePercent] = useState('');
  const [currentParam, setCurrentParam] = useState('');
  const [targetParam, setTargetParam] = useState('');
  const [paramType, setParamType] = useState<'nitrate' | 'phosphate' | 'custom'>('nitrate');

  const paramDefaults: Record<typeof paramType, { refill: string; label: string; unit: string }> = {
    nitrate: { refill: '0', label: 'Nitrate (NO₃)', unit: 'ppm' },
    phosphate: { refill: '0', label: 'Phosphate (PO₄)', unit: 'ppm' },
    custom: { refill: '0', label: 'Parameter', unit: 'units' },
  };

  function calcWaterChange() {
    const vol = parseFloat(tankVol);
    const pct = parseFloat(changePercent);
    if (!vol || !pct) return null;
    const changeVol = vol * (pct / 100);
    const galPerChange = changeVol;
    return { changeVol: galPerChange, liters: galPerChange * 3.78541 };
  }

  function calcChangesNeeded() {
    const cur = parseFloat(currentParam);
    const tgt = parseFloat(targetParam);
    const pct = parseFloat(changePercent);
    if (!cur || !tgt || !pct || cur <= tgt) return null;
    let val = cur;
    let changes = 0;
    while (val > tgt && changes < 50) {
      val = val * (1 - pct / 100);
      changes++;
    }
    return { changes, finalVal: val };
  }

  const wc = calcWaterChange();
  const nc = calcChangesNeeded();
  const inputCls = "w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors placeholder-slate-500";
  const tabCls = (active: boolean) => `px-3 py-1.5 rounded-md text-xs font-medium transition-all ${active ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200 border border-transparent'}`;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center">
          <Droplets size={16} className="text-sky-400" />
        </div>
        <div>
          <h3 className="text-white font-semibold text-sm">Water Change Calculator</h3>
          <p className="text-slate-500 text-xs">Volume and parameter dilution planning</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Tank Volume (gal)</label>
            <input className={inputCls} placeholder="100" value={tankVol} onChange={e => setTankVol(e.target.value)} type="number" min="0" />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Change Size (%)</label>
            <input className={inputCls} placeholder="20" value={changePercent} onChange={e => setChangePercent(e.target.value)} type="number" min="0" max="100" />
          </div>
        </div>

        {wc && (
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-800/60 rounded-xl p-3 text-center">
              <div className="text-xl font-bold text-sky-400">{wc.changeVol.toFixed(1)}</div>
              <div className="text-xs text-slate-400 mt-0.5">gallons to change</div>
            </div>
            <div className="bg-slate-800/60 rounded-xl p-3 text-center">
              <div className="text-xl font-bold text-teal-400">{wc.liters.toFixed(1)}</div>
              <div className="text-xs text-slate-400 mt-0.5">liters to change</div>
            </div>
          </div>
        )}

        <div className="border-t border-slate-800 pt-3">
          <p className="text-xs text-slate-400 mb-2 font-medium">Parameter dilution estimate</p>
          <div className="flex gap-2 mb-3">
            {(['nitrate', 'phosphate', 'custom'] as const).map(p => (
              <button key={p} onClick={() => setParamType(p)} className={tabCls(paramType === p)}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Current ({paramDefaults[paramType].unit})</label>
              <input className={inputCls} placeholder="40" value={currentParam} onChange={e => setCurrentParam(e.target.value)} type="number" min="0" step="0.1" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Target ({paramDefaults[paramType].unit})</label>
              <input className={inputCls} placeholder="10" value={targetParam} onChange={e => setTargetParam(e.target.value)} type="number" min="0" step="0.1" />
            </div>
          </div>

          {nc && (
            <div className="mt-3 bg-sky-500/10 border border-sky-500/20 rounded-xl p-3 flex items-center justify-between">
              <span className="text-sm text-slate-300">Water changes needed</span>
              <span className="text-xl font-bold text-sky-400">{nc.changes}</span>
            </div>
          )}
          {currentParam && targetParam && parseFloat(currentParam) <= parseFloat(targetParam) && (
            <div className="mt-3 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
              Target must be lower than current for dilution
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
