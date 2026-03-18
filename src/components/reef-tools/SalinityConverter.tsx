import { useState } from 'react';
import { Waves } from 'lucide-react';

type SalinityInput = 'sg' | 'ppt' | 'refractometer';

function sgToPpt(sg: number): number {
  return (sg - 1) * 1400;
}
function pptToSg(ppt: number): number {
  return 1 + ppt / 1400;
}
function refractToPpt(ref: number): number {
  return ref * 0.997;
}
function pptToRef(ppt: number): number {
  return ppt / 0.997;
}

export default function SalinityConverter() {
  const [mode, setMode] = useState<SalinityInput>('sg');
  const [value, setValue] = useState('');

  function getResults() {
    const v = parseFloat(value);
    if (isNaN(v) || v <= 0) return null;
    let ppt = 0;
    if (mode === 'sg') ppt = sgToPpt(v);
    else if (mode === 'ppt') ppt = v;
    else ppt = refractToPpt(v);
    const sg = pptToSg(ppt);
    const ref = pptToRef(ppt);
    return { sg, ppt, ref };
  }

  const res = getResults();
  const tabCls = (active: boolean) => `flex-1 py-2 rounded-lg text-xs font-medium transition-all ${active ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 border border-slate-300 dark:border-slate-700'}`;
  const inputCls = "w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors placeholder-slate-400 dark:placeholder-slate-500";

  const labels: Record<SalinityInput, string> = {
    sg: 'Specific Gravity (e.g. 1.025)',
    ppt: 'Parts Per Thousand (e.g. 35)',
    refractometer: 'Refractometer Reading (e.g. 35.1)',
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 transition-colors duration-200">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center">
          <Waves size={16} className="text-teal-400" />
        </div>
        <div>
          <h3 className="text-slate-900 dark:text-white font-semibold text-sm">Salinity Converter</h3>
          <p className="text-slate-400 dark:text-slate-500 text-xs">Convert between SG, PPT, and refractometer</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {(['sg', 'ppt', 'refractometer'] as SalinityInput[]).map(m => (
          <button key={m} onClick={() => { setMode(m); setValue(''); }} className={tabCls(mode === m)}>
            {m === 'refractometer' ? 'Refract.' : m.toUpperCase()}
          </button>
        ))}
      </div>

      <div>
        <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block">{labels[mode]}</label>
        <input
          className={inputCls}
          placeholder={mode === 'sg' ? '1.025' : '35.0'}
          value={value}
          onChange={e => setValue(e.target.value)}
          type="number"
          step="0.001"
          min="0"
        />
      </div>

      {res && (
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className={`rounded-xl p-3 text-center ${mode === 'sg' ? 'bg-cyan-500/10 border border-cyan-500/20' : 'bg-slate-100/60 dark:bg-slate-800/60'}`}>
            <div className="text-lg font-bold text-cyan-400">{res.sg.toFixed(4)}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">SG</div>
          </div>
          <div className={`rounded-xl p-3 text-center ${mode === 'ppt' ? 'bg-cyan-500/10 border border-cyan-500/20' : 'bg-slate-100/60 dark:bg-slate-800/60'}`}>
            <div className="text-lg font-bold text-teal-400">{res.ppt.toFixed(2)}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">PPT</div>
          </div>
          <div className={`rounded-xl p-3 text-center ${mode === 'refractometer' ? 'bg-cyan-500/10 border border-cyan-500/20' : 'bg-slate-100/60 dark:bg-slate-800/60'}`}>
            <div className="text-lg font-bold text-sky-400">{res.ref.toFixed(2)}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Refract.</div>
          </div>
        </div>
      )}

      <p className="text-xs text-slate-400 dark:text-slate-600 mt-3">
        Reference: NSW = 35 ppt / 1.0264 SG at 25°C
      </p>
    </div>
  );
}
