import { useState } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Activity } from 'lucide-react';

interface ParamDef {
  label: string;
  unit: string;
  ideal: [number, number];
  acceptable: [number, number];
  placeholder: string;
}

const PARAMS: Record<string, ParamDef> = {
  salinity: { label: 'Salinity', unit: 'ppt', ideal: [34, 36], acceptable: [33, 37], placeholder: '35' },
  temp: { label: 'Temperature', unit: '°F', ideal: [76, 80], acceptable: [74, 82], placeholder: '78' },
  ph: { label: 'pH', unit: '', ideal: [8.1, 8.4], acceptable: [7.9, 8.5], placeholder: '8.2' },
  alk: { label: 'Alkalinity', unit: 'dKH', ideal: [8, 10], acceptable: [7, 12], placeholder: '9.0' },
  calcium: { label: 'Calcium', unit: 'ppm', ideal: [400, 450], acceptable: [380, 470], placeholder: '420' },
  magnesium: { label: 'Magnesium', unit: 'ppm', ideal: [1250, 1400], acceptable: [1150, 1500], placeholder: '1300' },
  nitrate: { label: 'Nitrate (NO₃)', unit: 'ppm', ideal: [1, 10], acceptable: [0, 25], placeholder: '5' },
  phosphate: { label: 'Phosphate (PO₄)', unit: 'ppm', ideal: [0.03, 0.10], acceptable: [0, 0.20], placeholder: '0.05' },
};

type Status = 'ideal' | 'acceptable' | 'out' | 'empty';

function getStatus(value: string, def: ParamDef): Status {
  const v = parseFloat(value);
  if (isNaN(v)) return 'empty';
  if (v >= def.ideal[0] && v <= def.ideal[1]) return 'ideal';
  if (v >= def.acceptable[0] && v <= def.acceptable[1]) return 'acceptable';
  return 'out';
}

const statusConfig: Record<Exclude<Status, 'empty'>, { icon: typeof CheckCircle; color: string; bg: string; label: string }> = {
  ideal: { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', label: 'Ideal' },
  acceptable: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', label: 'Acceptable' },
  out: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', label: 'Out of Range' },
};

export default function ParameterChecker() {
  const [values, setValues] = useState<Record<string, string>>({});

  function setValue(key: string, val: string) {
    setValues(prev => ({ ...prev, [key]: val }));
  }

  const inputCls = "flex-1 min-w-0 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors placeholder-slate-400 dark:placeholder-slate-500";

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 transition-colors duration-200">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center">
          <Activity size={16} className="text-rose-400" />
        </div>
        <div>
          <h3 className="text-slate-900 dark:text-white font-semibold text-sm">Parameter Checker</h3>
          <p className="text-slate-400 dark:text-slate-500 text-xs">Enter your parameters to check if they're in range</p>
        </div>
      </div>

      <div className="space-y-2">
        {Object.entries(PARAMS).map(([key, def]) => {
          const status = getStatus(values[key] ?? '', def);
          const sc = status !== 'empty' ? statusConfig[status] : null;
          const Icon = sc?.icon;

          return (
            <div key={key} className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${sc ? sc.bg : 'border-transparent'}`}>
              <div className="w-24 sm:w-28 flex-shrink-0 min-w-0">
                <div className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">{def.label}</div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 hidden sm:block">
                  ideal: {def.ideal[0]}–{def.ideal[1]} {def.unit}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-1">
                <input
                  className={inputCls}
                  placeholder={def.placeholder}
                  value={values[key] ?? ''}
                  onChange={e => setValue(key, e.target.value)}
                  type="number"
                  step="any"
                  min="0"
                />
                {def.unit && <span className="text-xs text-slate-400 dark:text-slate-500 flex-shrink-0">{def.unit}</span>}
              </div>
              {sc && Icon && (
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <Icon size={14} className={sc.color} />
                  <span className={`text-xs font-medium ${sc.color} hidden sm:block`}>{sc.label}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center gap-4 text-xs text-slate-400 dark:text-slate-500">
        <div className="flex items-center gap-1"><CheckCircle size={12} className="text-emerald-400" /> Ideal</div>
        <div className="flex items-center gap-1"><AlertTriangle size={12} className="text-amber-400" /> Acceptable</div>
        <div className="flex items-center gap-1"><XCircle size={12} className="text-red-400" /> Out of Range</div>
      </div>
    </div>
  );
}
