import { ExternalLink, Tag } from 'lucide-react';
import { WwcProduct } from '../../lib/supabase';

interface WwcPriceCardProps {
  product: WwcProduct;
}

export default function WwcPriceCard({ product }: WwcPriceCardProps) {
  const hasDiscount = product.compare_at_price && product.compare_at_price > product.price;
  const discountPct = hasDiscount
    ? Math.round(((product.compare_at_price! - product.price) / product.compare_at_price!) * 100)
    : 0;

  const wwcUrl = `https://worldwidecorals.com/products/${product.handle}`;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-600 transition-all duration-200 group">
      <div className="relative aspect-square bg-slate-800 overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-600">
            <Tag size={32} />
          </div>
        )}
        {hasDiscount && (
          <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-md">
            -{discountPct}%
          </div>
        )}
        <div className="absolute top-2 right-2 bg-slate-900/80 text-xs text-slate-300 px-2 py-0.5 rounded-md capitalize">
          {product.collection.replace(/-/g, ' ')}
        </div>
      </div>

      <div className="p-3 space-y-2">
        <p className="text-white text-sm font-medium leading-snug line-clamp-2 min-h-[2.5rem]">
          {product.title}
        </p>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-cyan-400 font-bold text-lg">${product.price.toFixed(0)}</span>
            {hasDiscount && (
              <span className="text-slate-500 text-xs line-through ml-1.5">
                ${product.compare_at_price!.toFixed(0)}
              </span>
            )}
          </div>
          <a
            href={wwcUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-cyan-400 transition-colors"
          >
            WWC <ExternalLink size={11} />
          </a>
        </div>

        {product.product_type && (
          <div className="text-xs text-slate-500">{product.product_type}</div>
        )}
      </div>
    </div>
  );
}
