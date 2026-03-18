import { useState } from 'react';
import { Layers } from 'lucide-react';

type Shape = 'rectangle' | 'cylinder' | 'bowfront';
type Unit = 'inches' | 'cm';

export default function VolumeCalculator() {
  const [shape, setShape] = useState<Shape>('rectangle');
  const [unit, setUnit] = useState<Unit>('inches');
  const [l, setL] = useState('');
  const [w, setW] = useState('');
  const [h, setH] = useState('');
  const [d, setD] = useState('');

  function calcVolume(): { gal: number; lit: number } | null {
    const toIn = (v: number) => unit === 'cm' ? v / 2.54 : v;
    if (shape === 'rectangle' || shape === 'bowfront') {
      const lv = parseFloat(l), wv = parseFloat(w), hv = parseFloat(h);
      if (!lv || !wv || !hv) return null;
      const li = toIn(lv), wi = toIn(wv), hi = toIn(hv);
      const factor = shape === 'bowfront' ? 1.1 : 1;
      const gal = (li * wi * hi / 231) * factor;
      return { gal, lit: gal * 3.78541 };
    }
    if (shape === 'cylinder') {
      const dv = parseFloat(d), hv = parseFloat(h);
      if (!dv || !hv) return null;
      const ri = toIn(dv) / 2, hi = toIn(hv);
      const gal = Math.PI * ri * ri * hi / 231;
      return { gal, lit: gal * 3.78541 };
    }
    return null;
  }

  const result = calcVolume();

  const inputCls = "w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors placeholder-slate-400 dark:placeholder-slate-500";
  const tabCls = (active: boolean) => `px-3 py-1.5 rounded-md text-xs font-medium transition-all ${active ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 border border-transparent'}`;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 transition-colors duration-200">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
          <Layers size={16} className="text-cyan-400" />
        </div>
        <div>
          <h3 className="text-slate-900 dark:text-white font-semibold text-sm">Tank Volume</h3>
          <p className="text-slate-400 dark:text-slate-500 text-xs">Calculate your tank's capacity</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {(['rectangle', 'cylinder', 'bowfront'] as Shape[]).map(s => (
          <button key={s} onClick={() => setShape(s)} className={tabCls(shape === s)}>
            {s === 'bowfront' ? 'Bow Front' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div className="flex gap-2 mb-4">
        {(['inches', 'cm'] as Unit[]).map(u => (
          <button key={u} onClick={() => setUnit(u)} className={tabCls(unit === u)}>
            {u}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {shape === 'cylinder' ? (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Diameter ({unit})</label>
              <input className={inputCls} placeholder="0" value={d} onChange={e => setD(e.target.value)} type="number" min="0" />
            </div>
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Height ({unit})</label>
              <input className={inputCls} placeholder="0" value={h} onChange={e => setH(e.target.value)} type="number" min="0" />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Length ({unit})</label>
              <input className={inputCls} placeholder="0" value={l} onChange={e => setL(e.target.value)} type="number" min="0" />
            </div>
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Width ({unit})</label>
              <input className={inputCls} placeholder="0" value={w} onChange={e => setW(e.target.value)} type="number" min="0" />
            </div>
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Height ({unit})</label>
              <input className={inputCls} placeholder="0" value={h} onChange={e => setH(e.target.value)} type="number" min="0" />
            </div>
          </div>
        )}
        {shape === 'bowfront' && (
          <p className="text-xs text-slate-400 dark:text-slate-500">Bow-front volume estimated ~10% above rectangle</p>
        )}
      </div>

      {result && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="bg-slate-100/60 dark:bg-slate-800/60 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-cyan-400">{result.gal.toFixed(1)}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">US Gallons</div>
          </div>
          <div className="bg-slate-100/60 dark:bg-slate-800/60 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-teal-400">{result.lit.toFixed(1)}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Liters</div>
          </div>
        </div>
      )}
    </div>
  );
}
