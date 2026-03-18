import { useState } from 'react';
import { Beaker } from 'lucide-react';

type VolumeUnit = 'gallons' | 'liters';

export default function SaltMixCalculator() {
  const [volume, setVolume] = useState('');
  const [unit, setUnit] = useState<VolumeUnit>('gallons');
  const [targetSg, setTargetSg] = useState('1.025');
  const [saltBrand, setSaltBrand] = useState<'generic' | 'instant_ocean' | 'red_sea'>('generic');

  const brandCupPerGal: Record<typeof saltBrand, number> = {
    generic: 0.5,
    instant_ocean: 0.5,
    red_sea: 0.53,
  };

  function calcSalt() {
    const vol = parseFloat(volume);
    const sg = parseFloat(targetSg);
    if (!vol || !sg || sg <= 1 || sg > 1.035) return null;

    const volGal = unit === 'liters' ? vol / 3.78541 : vol;
    const ppt = (sg - 1) * 1400;
    const targetPpt35Ratio = ppt / 35;
    const cupsAt35 = volGal * brandCupPerGal[saltBrand];
    const cups = cupsAt35 * targetPpt35Ratio;
    const grams = cups * 236.6 * 1.2;
    const oz = grams / 28.35;
    const lbs = oz / 16;

    return { cups, grams, oz, lbs, ppt };
  }

  const result = calcSalt();
  const inputCls = "w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors placeholder-slate-400 dark:placeholder-slate-500";
  const selectCls = "w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors";
  const tabCls = (active: boolean) => `flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${active ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 border border-slate-300 dark:border-slate-700'}`;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 transition-colors duration-200">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
          <Beaker size={16} className="text-amber-400" />
        </div>
        <div>
          <h3 className="text-slate-900 dark:text-white font-semibold text-sm">Salt Mix Calculator</h3>
          <p className="text-slate-400 dark:text-slate-500 text-xs">How much salt to mix a batch of saltwater</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block">Volume to mix</label>
            <input className={inputCls} placeholder="20" value={volume} onChange={e => setVolume(e.target.value)} type="number" min="0" />
          </div>
          <div>
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block">Unit</label>
            <div className="flex gap-1 h-[38px]">
              {(['gallons', 'liters'] as VolumeUnit[]).map(u => (
                <button key={u} onClick={() => setUnit(u)} className={tabCls(unit === u)}>
                  {u === 'gallons' ? 'gal' : 'L'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block">Target Specific Gravity</label>
          <input className={inputCls} placeholder="1.025" value={targetSg} onChange={e => setTargetSg(e.target.value)} type="number" min="1.000" max="1.035" step="0.001" />
          {result && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{result.ppt.toFixed(1)} ppt</p>}
        </div>

        <div>
          <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block">Salt Brand</label>
          <select className={selectCls} value={saltBrand} onChange={e => setSaltBrand(e.target.value as typeof saltBrand)}>
            <option value="generic">Generic (0.5 cup/gal)</option>
            <option value="instant_ocean">Instant Ocean (~0.5 cup/gal)</option>
            <option value="red_sea">Red Sea (~0.53 cup/gal)</option>
          </select>
        </div>
      </div>

      {result && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="bg-slate-100/60 dark:bg-slate-800/60 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-amber-400">{result.cups.toFixed(2)}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">cups of salt</div>
          </div>
          <div className="bg-slate-100/60 dark:bg-slate-800/60 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-teal-400">{result.lbs.toFixed(2)}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">lbs of salt</div>
          </div>
          <div className="bg-slate-100/60 dark:bg-slate-800/60 rounded-xl p-3 text-center col-span-2">
            <div className="text-2xl font-bold text-cyan-400">{result.grams.toFixed(0)}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">grams</div>
          </div>
        </div>
      )}

      <p className="text-xs text-slate-400 dark:text-slate-600 mt-3">Estimates based on dry salt. Always calibrate with a refractometer.</p>
    </div>
  );
}
