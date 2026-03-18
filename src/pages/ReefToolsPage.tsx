import { useState } from 'react';
import { Wrench } from 'lucide-react';
import VolumeCalculator from '../components/reef-tools/VolumeCalculator';
import SalinityConverter from '../components/reef-tools/SalinityConverter';
import DosingCalculator from '../components/reef-tools/DosingCalculator';
import WaterChangeCalculator from '../components/reef-tools/WaterChangeCalculator';
import TurnoverCalculator from '../components/reef-tools/TurnoverCalculator';
import SaltMixCalculator from '../components/reef-tools/SaltMixCalculator';
import ParameterChecker from '../components/reef-tools/ParameterChecker';

type Category = 'all' | 'chemistry' | 'tank' | 'dosing';

const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'all', label: 'All Tools' },
  { id: 'chemistry', label: 'Chemistry' },
  { id: 'tank', label: 'Tank Setup' },
  { id: 'dosing', label: 'Dosing' },
];

interface Tool {
  id: string;
  category: Exclude<Category, 'all'>;
  component: React.ReactNode;
}

export default function ReefToolsPage() {
  const [category, setCategory] = useState<Category>('all');

  const tools: Tool[] = [
    { id: 'params', category: 'chemistry', component: <ParameterChecker /> },
    { id: 'salinity', category: 'chemistry', component: <SalinityConverter /> },
    { id: 'dosing', category: 'dosing', component: <DosingCalculator /> },
    { id: 'saltmix', category: 'dosing', component: <SaltMixCalculator /> },
    { id: 'volume', category: 'tank', component: <VolumeCalculator /> },
    { id: 'turnover', category: 'tank', component: <TurnoverCalculator /> },
    { id: 'waterchange', category: 'dosing', component: <WaterChangeCalculator /> },
  ];

  const visible = category === 'all' ? tools : tools.filter(t => t.category === category);

  const tabCls = (active: boolean) =>
    `px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
      active
        ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
        : 'text-slate-400 hover:text-white border border-transparent hover:border-slate-700'
    }`;

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <Wrench size={20} className="text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Reef Tools</h1>
            <p className="text-slate-400 text-sm">Calculators and references for reef hobbyists</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {CATEGORIES.map(c => (
          <button key={c.id} onClick={() => setCategory(c.id)} className={tabCls(category === c.id)}>
            {c.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {visible.map(tool => (
          <div key={tool.id}>
            {tool.component}
          </div>
        ))}
      </div>

      <p className="text-xs text-slate-600 mt-8 text-center">
        Calculations are estimates. Always verify with calibrated test equipment. Parameters may vary by coral species and system.
      </p>
    </div>
  );
}
