import { WwcProduct } from '../../lib/supabase';

interface WwcPriceStatsProps {
  products: WwcProduct[];
  collection: string;
}

export default function WwcPriceStats({ products, collection }: WwcPriceStatsProps) {
  if (products.length === 0) return null;

  const prices = products.map(p => p.price);
  const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const onSale = products.filter(p => p.compare_at_price && p.compare_at_price > p.price).length;

  const buckets = [
    { label: 'Under $50', count: prices.filter(p => p < 50).length },
    { label: '$50–$100', count: prices.filter(p => p >= 50 && p < 100).length },
    { label: '$100–$200', count: prices.filter(p => p >= 100 && p < 200).length },
    { label: '$200–$500', count: prices.filter(p => p >= 200 && p < 500).length },
    { label: '$500+', count: prices.filter(p => p >= 500).length },
  ];

  const maxBucket = Math.max(...buckets.map(b => b.count));

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 space-y-4">
      <div>
        <h3 className="text-white font-semibold capitalize">{collection.replace(/-/g, ' ')} — Price Summary</h3>
        <p className="text-slate-500 text-xs mt-0.5">{products.length} products listed on WorldWideCoral</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-800 rounded-xl p-3 text-center">
          <div className="text-white font-bold text-xl">${avg.toFixed(0)}</div>
          <div className="text-slate-400 text-xs mt-0.5">Avg Price</div>
        </div>
        <div className="bg-slate-800 rounded-xl p-3 text-center">
          <div className="text-emerald-400 font-bold text-xl">${min.toFixed(0)}</div>
          <div className="text-slate-400 text-xs mt-0.5">Lowest</div>
        </div>
        <div className="bg-slate-800 rounded-xl p-3 text-center">
          <div className="text-red-400 font-bold text-xl">${max.toFixed(0)}</div>
          <div className="text-slate-400 text-xs mt-0.5">Highest</div>
        </div>
        <div className="bg-slate-800 rounded-xl p-3 text-center">
          <div className="text-amber-400 font-bold text-xl">{onSale}</div>
          <div className="text-slate-400 text-xs mt-0.5">On Sale</div>
        </div>
      </div>

      <div>
        <p className="text-slate-400 text-xs uppercase tracking-wider mb-3">Price Distribution</p>
        <div className="space-y-1.5">
          {buckets.map(bucket => (
            <div key={bucket.label} className="flex items-center gap-3">
              <span className="text-slate-400 text-xs w-20 shrink-0">{bucket.label}</span>
              <div className="flex-1 bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-teal-600 rounded-full transition-all duration-500"
                  style={{ width: maxBucket > 0 ? `${(bucket.count / maxBucket) * 100}%` : '0%' }}
                />
              </div>
              <span className="text-slate-500 text-xs w-6 text-right">{bucket.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
