import { RarityTier } from '../../lib/supabase';

const rarityConfig: Record<RarityTier, { label: string; className: string }> = {
  Common: { label: 'Common', className: 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600' },
  Uncommon: { label: 'Uncommon', className: 'bg-emerald-900/60 text-emerald-400 border border-emerald-700' },
  Rare: { label: 'Rare', className: 'bg-blue-900/60 text-blue-400 border border-blue-700' },
  'Ultra Rare': { label: 'Ultra Rare', className: 'bg-orange-900/60 text-orange-400 border border-orange-700' },
  Grail: { label: 'GRAIL', className: 'bg-gradient-to-r from-yellow-900/80 to-orange-900/80 text-yellow-400 border border-yellow-600 font-bold' },
};

interface RarityBadgeProps {
  tier: RarityTier;
  size?: 'sm' | 'md';
}

export default function RarityBadge({ tier, size = 'sm' }: RarityBadgeProps) {
  const config = rarityConfig[tier];
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1';
  return (
    <span className={`inline-flex items-center rounded-full ${sizeClass} ${config.className} whitespace-nowrap`}>
      {config.label}
    </span>
  );
}
