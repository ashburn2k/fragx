import { ExternalLink } from 'lucide-react';
import { VendorProduct } from '../../lib/supabase';
import { getProductNormalizedTags, NormalizedTag } from '../../lib/tagNormalizer';

interface VendorProductCardProps {
  product: VendorProduct;
  vendorBaseUrl: string;
  vendorName?: string;
  showVendorBadge?: boolean;
}

const TAG_COLOR_CLASSES: Record<NormalizedTag['color'], string> = {
  cyan:    'bg-cyan-900/40 text-cyan-400 border-cyan-800/60',
  teal:    'bg-teal-900/40 text-teal-400 border-teal-800/60',
  amber:   'bg-amber-900/40 text-amber-400 border-amber-800/60',
  rose:    'bg-rose-900/40 text-rose-400 border-rose-800/60',
  slate:   'bg-slate-800 text-slate-400 border-slate-700',
  emerald: 'bg-emerald-900/40 text-emerald-400 border-emerald-800/60',
  sky:     'bg-sky-900/40 text-sky-400 border-sky-800/60',
  orange:  'bg-orange-900/40 text-orange-400 border-orange-800/60',
};

export default function VendorProductCard({ product, vendorBaseUrl, vendorName, showVendorBadge }: VendorProductCardProps) {
  const discountPct = product.compare_at_price && product.compare_at_price > product.price
    ? Math.round((1 - product.price / product.compare_at_price) * 100)
    : null;

  const productUrl = `${vendorBaseUrl}/products/${product.handle}`;
  const normalizedTags = getProductNormalizedTags(product.tags).slice(0, 3);

  return (
    <a
      href={productUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-600 transition-all duration-200"
    >
      <div className="relative aspect-square bg-slate-800 overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs">
            No image
          </div>
        )}
        {discountPct && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
            -{discountPct}%
          </span>
        )}
        <span className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/80 rounded p-1">
          <ExternalLink size={11} className="text-white" />
        </span>
      </div>
      <div className="p-2.5 flex flex-col gap-1.5 flex-1">
        <p className="text-white text-xs font-medium leading-snug line-clamp-2 group-hover:text-cyan-300 transition-colors">
          {product.title}
        </p>
        {showVendorBadge && vendorName ? (
          <p className="text-[10px] truncate">
            <span className="bg-slate-800 text-cyan-400 border border-slate-700 px-1.5 py-0.5 rounded font-medium">
              {vendorName}
            </span>
          </p>
        ) : (
          <p className="text-slate-500 text-[10px] capitalize truncate">
            {product.collection.replace(/-/g, ' ')}
          </p>
        )}
        {normalizedTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {normalizedTags.map(tag => (
              <span
                key={tag.label}
                className={`inline-block text-[9px] font-medium px-1.5 py-0.5 rounded border ${TAG_COLOR_CLASSES[tag.color]}`}
              >
                {tag.label}
              </span>
            ))}
          </div>
        )}
        <div className="flex items-baseline gap-1.5 mt-auto pt-0.5">
          <span className="text-cyan-400 font-bold text-sm">${product.price.toFixed(2)}</span>
          {product.compare_at_price && (
            <span className="text-slate-500 text-[10px] line-through">
              ${product.compare_at_price.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </a>
  );
}
