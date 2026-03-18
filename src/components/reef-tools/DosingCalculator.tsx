import { useState } from 'react';
import { FlaskConical } from 'lucide-react';

type Parameter = 'alk' | 'calcium' | 'magnesium';
type AlkReagent = 'baking_soda' | 'soda_ash';
type CalcReagent = 'cacl2_anhydrous' | 'cacl2_dihydrate';
type MagReagent = 'mgcl2' | 'mgso4';

const ALK_REAGENTS: Record<AlkReagent, { label: string; gPerLPerDkh: number }> = {
  baking_soda: { label: 'Sodium Bicarbonate (Baking Soda)', gPerLPerDkh: 0.015 },
  soda_ash: { label: 'Soda Ash (Na₂CO₃)', gPerLPerDkh: 0.00946 },
};

const CALC_REAGENTS: Record<CalcReagent, { label: string; gPerLPer10ppm: number }> = {
  cacl2_anhydrous: { label: 'CaCl₂ Anhydrous (100%)', gPerLPer10ppm: 0.02778 },
  cacl2_dihydrate: { label: 'CaCl₂ Dihydrate (77%)', gPerLPer10ppm: 0.03676 },
};

const MAG_REAGENTS: Record<MagReagent, { label: string; gPerLPer10ppm: number }> = {
  mgcl2: { label: 'MgCl₂·6H₂O (Mag Chloride)', gPerLPer10ppm: 0.08475 },
  mgso4: { label: 'MgSO₄·7H₂O (Epsom Salt)', gPerLPer10ppm: 0.10204 },
};

function gallonsToLiters(gal: number) { return gal * 3.78541; }

export default function DosingCalculator() {
  const [param, setParam] = useState<Parameter>('alk');
  const [volGal, setVolGal] = useState('');
  const [current, setCurrent] = useState('');
  const [target, setTarget] = useState('');
  const [alkReagent, setAlkReagent] = useState<AlkReagent>('baking_soda');
  const [calcReagent, setCalcReagent] = useState<CalcReagent>('cacl2_anhydrous');
  const [magReagent, setMagReagent] = useState<MagReagent>('mgcl2');

  function calc(): { grams: number; tsp: number } | null {
    const vol = parseFloat(volGal);
    const cur = parseFloat(current);
    const tgt = parseFloat(target);
    if (isNaN(vol) || isNaN(cur) || isNaN(tgt) || vol <= 0) return null;
    const delta = tgt - cur;
    if (delta <= 0) return null;
    const liters = gallonsToLiters(vol);

    let grams = 0;
    if (param === 'alk') {
      grams = liters * delta * ALK_REAGENTS[alkReagent].gPerLPerDkh;
    } else if (param === 'calcium') {
      grams = liters * (delta / 10) * CALC_REAGENTS[calcReagent].gPerLPer10ppm;
    } else {
      grams = liters * (delta / 10) * MAG_REAGENTS[magReagent].gPerLPer10ppm;
    }
    const tsp = grams / 5.9;
    return { grams, tsp };
  }

  const result = calc();
  const inputCls = "w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors placeholder-slate-500";
  const selectCls = "w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors";
  const tabCls = (active: boolean) => `flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${active ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200 border border-slate-700'}`;

  const paramConfig: Record<Parameter, { label: string; unit: string; placeholder: [string, string] }> = {
    alk: { label: 'Alkalinity', unit: 'dKH', placeholder: ['8.3', '9.0'] },
    calcium: { label: 'Calcium', unit: 'ppm', placeholder: ['400', '420'] },
    magnesium: { label: 'Magnesium', unit: 'ppm', placeholder: ['1250', '1350'] },
  };

  const cfg = paramConfig[param];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
          <FlaskConical size={16} className="text-emerald-400" />
        </div>
        <div>
          <h3 className="text-white font-semibold text-sm">Dosing Calculator</h3>
          <p className="text-slate-500 text-xs">How much reagent to raise your parameters</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {(['alk', 'calcium', 'magnesium'] as Parameter[]).map(p => (
          <button key={p} onClick={() => setParam(p)} className={tabCls(param === p)}>
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs text-slate-400 mb-1.5 block">Tank Volume (US gallons)</label>
          <input className={inputCls} placeholder="100" value={volGal} onChange={e => setVolGal(e.target.value)} type="number" min="0" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Current {cfg.unit}</label>
            <input className={inputCls} placeholder={cfg.placeholder[0]} value={current} onChange={e => setCurrent(e.target.value)} type="number" min="0" step="0.1" />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Target {cfg.unit}</label>
            <input className={inputCls} placeholder={cfg.placeholder[1]} value={target} onChange={e => setTarget(e.target.value)} type="number" min="0" step="0.1" />
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-400 mb-1.5 block">Reagent</label>
          {param === 'alk' && (
            <select className={selectCls} value={alkReagent} onChange={e => setAlkReagent(e.target.value as AlkReagent)}>
              {Object.entries(ALK_REAGENTS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          )}
          {param === 'calcium' && (
            <select className={selectCls} value={calcReagent} onChange={e => setCalcReagent(e.target.value as CalcReagent)}>
              {Object.entries(CALC_REAGENTS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          )}
          {param === 'magnesium' && (
            <select className={selectCls} value={magReagent} onChange={e => setMagReagent(e.target.value as MagReagent)}>
              {Object.entries(MAG_REAGENTS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          )}
        </div>
      </div>

      {result ? (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="bg-slate-800/60 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-emerald-400">{result.grams.toFixed(2)}</div>
            <div className="text-xs text-slate-400 mt-0.5">grams</div>
          </div>
          <div className="bg-slate-800/60 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-teal-400">{result.tsp.toFixed(2)}</div>
            <div className="text-xs text-slate-400 mt-0.5">teaspoons</div>
          </div>
        </div>
      ) : (
        parseFloat(current) >= parseFloat(target) && parseFloat(target) > 0 && (
          <div className="mt-4 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-center text-amber-400 text-xs">
            Target must be higher than current value
          </div>
        )
      )}
    </div>
  );
}
