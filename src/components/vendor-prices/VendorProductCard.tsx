import { ExternalLink } from 'lucide-react';
import { VendorProduct } from '../../lib/supabase';
import { getProductNormalizedTags, NormalizedTag } from '../../lib/tagNormalizer';

interface VendorProductCardProps {
  product: VendorProduct;
  vendorBaseUrl: string;
  vendorName?: string;
  showVendorBadge?: boolean;
  vendorSlug?: string;
}

const TAG_COLOR_CLASSES: Record<NormalizedTag['color'], string> = {
  cyan:    'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800/60',
  teal:    'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-400 border-teal-200 dark:border-teal-800/60',
  amber:   'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60',
  rose:    'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60',
  slate:   'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700',
  emerald: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60',
  sky:     'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800/60',
  orange:  'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800/60',
};

export default function VendorProductCard({ product, vendorBaseUrl, vendorName, showVendorBadge, vendorSlug }: VendorProductCardProps) {
  const isAreefCreation = (vendorSlug ?? product.vendor_slug) === 'areef-creation';
  const hidePrice = isAreefCreation && product.price === 10000;
  const isAuction = isAreefCreation && product.price === 1;

  const discountPct = !hidePrice && !isAuction && product.compare_at_price && product.compare_at_price > product.price
    ? Math.round((1 - product.price / product.compare_at_price) * 100)
    : null;

  const productUrl = product.handle.endsWith('.html')
    ? `${vendorBaseUrl}/${product.handle}`
    : `${vendorBaseUrl}/products/${product.handle}`;
  const normalizedTags = getProductNormalizedTags(product.tags).slice(0, 3);

  const soldOut = !product.is_available;

  return (
    <a
      href={productUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`group flex flex-col border rounded-xl overflow-hidden transition-all duration-200 ${
        soldOut
          ? 'bg-slate-50 dark:bg-slate-950 border-slate-300/50 dark:border-slate-700/50 hover:border-slate-400 dark:hover:border-slate-600'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600'
      }`}
    >
      <div className="relative aspect-square bg-slate-100 dark:bg-slate-800 overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-600 text-xs">
            No image
          </div>
        )}
        {soldOut ? (
          <span className="absolute top-2 left-2 bg-slate-900/90 text-slate-200 text-[10px] font-bold px-1.5 py-0.5 rounded border border-slate-600">
            SOLD OUT
          </span>
        ) : discountPct ? (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
            -{discountPct}%
          </span>
        ) : null}
        <span className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/80 rounded p-1">
          <ExternalLink size={11} className="text-white" />
        </span>
      </div>
      <div className="p-2.5 flex flex-col gap-1.5 flex-1">
        <p className={`text-xs font-medium leading-snug line-clamp-2 transition-colors ${soldOut ? 'text-slate-500 dark:text-slate-400 group-hover:text-slate-400 dark:group-hover:text-slate-300' : 'text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-300'}`}>
          {product.title}
        </p>
        {showVendorBadge && vendorName ? (
          <p className="text-[10px] truncate">
            <span className="bg-cyan-50 dark:bg-slate-800 text-cyan-900 dark:text-cyan-400 border border-cyan-200 dark:border-slate-700 px-1.5 py-0.5 rounded font-semibold">
              {vendorName}
            </span>
          </p>
        ) : (
          <p className="text-slate-500 dark:text-slate-500 text-[10px] capitalize truncate">
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
          {hidePrice ? (
            <span className="text-slate-400 dark:text-slate-500 text-xs italic">Price on request</span>
          ) : isAuction ? (
            <span className="text-amber-400 text-xs font-semibold">Auction Price</span>
          ) : (
            <>
              <span className={`font-bold text-sm ${soldOut ? 'text-slate-500 line-through' : 'text-cyan-400'}`}>
                ${product.price.toFixed(2)}
              </span>
              {!soldOut && product.compare_at_price && (
                <span className="text-slate-400 dark:text-slate-500 text-[10px] line-through">
                  ${product.compare_at_price.toFixed(2)}
                </span>
              )}
            </>
          )}
        </div>
      </div>
    </a>
  );
}
