import { TrendingDown, TrendingUp, Minus } from 'lucide-react';

type PriceStatus = 'deal' | 'fair' | 'overpriced';

const statusConfig: Record<PriceStatus, { label: string; className: string; Icon: typeof TrendingDown }> = {
  deal: { label: 'Deal', className: 'bg-emerald-900/60 text-emerald-400 border border-emerald-700', Icon: TrendingDown },
  fair: { label: 'Fair Price', className: 'bg-slate-700 text-slate-300 border border-slate-600', Icon: Minus },
  overpriced: { label: 'Overpriced', className: 'bg-red-900/60 text-red-400 border border-red-700', Icon: TrendingUp },
};

interface PriceBadgeProps {
  status: PriceStatus;
}

export default function PriceBadge({ status }: PriceBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.Icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full text-xs px-2 py-0.5 ${config.className}`}>
      <Icon size={10} />
      {config.label}
    </span>
  );
}

export function getPriceStatus(price: number, avgPrice: number): PriceStatus {
  if (avgPrice === 0) return 'fair';
  const ratio = price / avgPrice;
  if (ratio < 0.85) return 'deal';
  if (ratio > 1.2) return 'overpriced';
  return 'fair';
}
