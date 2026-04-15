import { useState } from 'react';
import { Layers, Weight } from 'lucide-react';

type Shape = 'rectangle' | 'cylinder' | 'bowfront';
type Unit = 'inches' | 'cm';
type Material = 'glass' | 'acrylic';
type WaterType = 'saltwater' | 'freshwater';

const GLASS_DENSITY_LBS_PER_IN3 = 0.0926;
const ACRYLIC_DENSITY_LBS_PER_IN3 = 0.0428;

const THICKNESS_OPTIONS = [
  { label: '1/4"', value: 0.25 },
  { label: '3/8"', value: 0.375 },
  { label: '1/2"', value: 0.5 },
  { label: '3/4"', value: 0.75 },
  { label: '1"', value: 1.0 },
  { label: 'Custom', value: -1 },
];

function calcPanelVolumeIn3(
  shape: Shape,
  material: Material,
  thicknessIn: number,
  dims: { l: number; w: number; h: number; d: number }
): number {
  const t = thicknessIn;
  if (shape === 'cylinder') {
    const r = dims.d / 2;
    const wallVol = Math.PI * ((r + t) ** 2 - r ** 2) * dims.h;
    const bottomVol = Math.PI * (r + t) ** 2 * t;
    return wallVol + bottomVol;
  }
  const { l, w, h } = dims;
  // bottom: full L x W
  const bottom = l * w * t;
  // front + back: full L x H
  const frontBack = 2 * l * h * t;
  // sides: (W - 2t) x H for glass overlap; acrylic often same, use same formula
  const sides = 2 * Math.max(w - 2 * t, w * 0.95) * h * t;
  return bottom + frontBack + sides;
}

export default function VolumeCalculator() {
  const [shape, setShape] = useState<Shape>('rectangle');
  const [unit, setUnit] = useState<Unit>('inches');
  const [l, setL] = useState('');
  const [w, setW] = useState('');
  const [h, setH] = useState('');
  const [d, setD] = useState('');

  const [showWeight, setShowWeight] = useState(false);
  const [material, setMaterial] = useState<Material>('glass');
  const [waterType, setWaterType] = useState<WaterType>('saltwater');
  const [thicknessIdx, setThicknessIdx] = useState(1);
  const [customThickness, setCustomThickness] = useState('');

  const toIn = (v: number) => unit === 'cm' ? v / 2.54 : v;

  function getDimsIn() {
    return {
      l: toIn(parseFloat(l) || 0),
      w: toIn(parseFloat(w) || 0),
      h: toIn(parseFloat(h) || 0),
      d: toIn(parseFloat(d) || 0),
    };
  }

  function calcVolume(): { gal: number; lit: number } | null {
    const dims = getDimsIn();
    if (shape === 'rectangle' || shape === 'bowfront') {
      if (!dims.l || !dims.w || !dims.h) return null;
      const factor = shape === 'bowfront' ? 1.1 : 1;
      const gal = (dims.l * dims.w * dims.h / 231) * factor;
      return { gal, lit: gal * 3.78541 };
    }
    if (shape === 'cylinder') {
      if (!dims.d || !dims.h) return null;
      const ri = dims.d / 2;
      const gal = Math.PI * ri * ri * dims.h / 231;
      return { gal, lit: gal * 3.78541 };
    }
    return null;
  }

  function getThicknessIn(): number {
    const opt = THICKNESS_OPTIONS[thicknessIdx];
    if (opt.value === -1) {
      const cv = parseFloat(customThickness);
      return isNaN(cv) ? 0 : toIn(cv);
    }
    return opt.value;
  }

  function calcWeights(gal: number): { waterLbs: number; tankLbs: number; totalLbs: number } | null {
    const thk = getThicknessIn();
    if (!thk) return null;
    const dims = getDimsIn();
    const density = material === 'glass' ? GLASS_DENSITY_LBS_PER_IN3 : ACRYLIC_DENSITY_LBS_PER_IN3;
    const panelVol = calcPanelVolumeIn3(shape, material, thk, dims);
    const tankLbs = panelVol * density;
    const waterLbsPerGal = waterType === 'saltwater' ? 8.55 : 8.34;
    const waterLbs = gal * waterLbsPerGal;
    return { waterLbs, tankLbs, totalLbs: waterLbs + tankLbs };
  }

  const result = calcVolume();
  const weights = result && showWeight ? calcWeights(result.gal) : null;

  const inputCls = "w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-2 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors placeholder-slate-400 dark:placeholder-slate-500 min-w-0";
  const tabCls = (active: boolean) =>
    `px-3 py-1.5 rounded-md text-xs font-medium transition-all ${active
      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 border border-transparent'}`;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 transition-colors duration-200">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
          <Layers size={16} className="text-cyan-400" />
        </div>
        <div>
          <h3 className="text-slate-900 dark:text-white font-semibold text-sm">Tank Volume & Weight</h3>
          <p className="text-slate-400 dark:text-slate-500 text-xs">Volume, water weight, and tank weight</p>
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
          <div className="grid grid-cols-3 gap-1.5">
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">L ({unit})</label>
              <input className={inputCls} placeholder="0" value={l} onChange={e => setL(e.target.value)} type="number" min="0" />
            </div>
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">W ({unit})</label>
              <input className={inputCls} placeholder="0" value={w} onChange={e => setW(e.target.value)} type="number" min="0" />
            </div>
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">H ({unit})</label>
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

      <div className="mt-4 border-t border-slate-200 dark:border-slate-800 pt-4">
        <button
          onClick={() => setShowWeight(v => !v)}
          className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-cyan-400 transition-colors"
        >
          <Weight size={13} />
          {showWeight ? 'Hide weight calculator' : 'Add tank weight calculation'}
        </button>

        {showWeight && (
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 mb-2 block">Material</label>
                <div className="flex gap-2">
                  {(['glass', 'acrylic'] as Material[]).map(m => (
                    <button key={m} onClick={() => setMaterial(m)} className={tabCls(material === m)}>
                      {m.charAt(0).toUpperCase() + m.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 mb-2 block">Water Type</label>
                <div className="flex gap-2">
                  {(['saltwater', 'freshwater'] as WaterType[]).map(wt => (
                    <button key={wt} onClick={() => setWaterType(wt)} className={tabCls(waterType === wt)}>
                      {wt === 'saltwater' ? 'Salt' : 'Fresh'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 mb-2 block">
                Glass Thickness
                {unit === 'cm' && THICKNESS_OPTIONS[thicknessIdx].value !== -1 && (
                  <span className="ml-1 text-slate-400 dark:text-slate-600">
                    ({(THICKNESS_OPTIONS[thicknessIdx].value * 2.54).toFixed(2)} cm)
                  </span>
                )}
              </label>
              <div className="flex flex-wrap gap-2">
                {THICKNESS_OPTIONS.map((opt, i) => (
                  <button key={i} onClick={() => setThicknessIdx(i)} className={tabCls(thicknessIdx === i)}>
                    {opt.label}
                  </button>
                ))}
              </div>
              {THICKNESS_OPTIONS[thicknessIdx].value === -1 && (
                <div className="mt-2">
                  <input
                    className={inputCls}
                    placeholder={`Thickness (${unit})`}
                    value={customThickness}
                    onChange={e => setCustomThickness(e.target.value)}
                    type="number"
                    min="0"
                    step="0.01"
                  />
                </div>
              )}
              <p className="text-xs text-slate-400 dark:text-slate-600 mt-1.5">
                {material === 'glass'
                  ? 'Standard glass panels — density 0.0926 lb/in³'
                  : 'Cast acrylic panels — density 0.0428 lb/in³ (lighter than glass)'}
              </p>
            </div>

            {weights && result && (
              <div className="space-y-2">
                <div className="bg-slate-100/60 dark:bg-slate-800/60 rounded-xl p-3 space-y-2">
                  <div className="flex flex-wrap justify-between items-start gap-1 text-xs">
                    <span className="text-slate-500 dark:text-slate-400 flex-1 min-w-0">
                      Water weight ({waterType === 'saltwater' ? '8.55 lb/gal' : '8.34 lb/gal'})
                    </span>
                    <span className="text-slate-700 dark:text-slate-300 font-medium tabular-nums flex-shrink-0">
                      {weights.waterLbs.toFixed(1)} lbs / {(weights.waterLbs * 0.453592).toFixed(1)} kg
                    </span>
                  </div>
                  <div className="flex flex-wrap justify-between items-start gap-1 text-xs">
                    <span className="text-slate-500 dark:text-slate-400 flex-1 min-w-0">
                      {material.charAt(0).toUpperCase() + material.slice(1)} tank ({THICKNESS_OPTIONS[thicknessIdx].value !== -1 ? THICKNESS_OPTIONS[thicknessIdx].label : `${customThickness} ${unit}`} thick)
                    </span>
                    <span className="text-slate-700 dark:text-slate-300 font-medium tabular-nums flex-shrink-0">
                      {weights.tankLbs.toFixed(1)} lbs / {(weights.tankLbs * 0.453592).toFixed(1)} kg
                    </span>
                  </div>
                  <div className="border-t border-slate-300 dark:border-slate-700 pt-2 flex justify-between items-center gap-2">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">Total filled weight</span>
                    <div className="text-right flex-shrink-0">
                      <span className="text-base font-bold text-cyan-400 tabular-nums">
                        {weights.totalLbs.toFixed(0)} lbs
                      </span>
                      <span className="text-xs text-slate-400 dark:text-slate-500 ml-1.5 tabular-nums">
                        {(weights.totalLbs * 0.453592).toFixed(0)} kg
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-600">
                  Estimates assume 5 panels (no lid). Substrate, rock, and equipment add additional weight.
                </p>
              </div>
            )}

            {showWeight && !result && (
              <p className="text-xs text-slate-400 dark:text-slate-500">Enter tank dimensions above to see weight estimates.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
