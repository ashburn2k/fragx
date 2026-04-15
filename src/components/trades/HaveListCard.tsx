import { ArrowLeftRight, MapPin, Package, Truck, User } from 'lucide-react';
import { HaveListItem } from '../../lib/supabase';

interface HaveListCardProps {
  item: HaveListItem;
  onClick: () => void;
}

const PLACEHOLDER_IMAGES = [
  'https://images.pexels.com/photos/1618606/pexels-photo-1618606.jpeg?auto=compress&cs=tinysrgb&w=600',
  'https://images.pexels.com/photos/3224096/pexels-photo-3224096.jpeg?auto=compress&cs=tinysrgb&w=600',
  'https://images.pexels.com/photos/1108341/pexels-photo-1108341.jpeg?auto=compress&cs=tinysrgb&w=600',
  'https://images.pexels.com/photos/847393/pexels-photo-847393.jpeg?auto=compress&cs=tinysrgb&w=600',
];

const TYPE_COLORS: Record<string, string> = {
  SPS: 'bg-cyan-500/90 text-white',
  LPS: 'bg-teal-500/90 text-white',
  'Soft Coral': 'bg-emerald-500/90 text-white',
  Zoanthids: 'bg-orange-500/90 text-white',
  Mushrooms: 'bg-rose-500/90 text-white',
  'Frag Pack': 'bg-amber-500/90 text-white',
  Other: 'bg-slate-500/90 text-white',
};

export default function HaveListCard({ item, onClick }: HaveListCardProps) {
  const placeholderIndex = item.id.charCodeAt(0) % PLACEHOLDER_IMAGES.length;
  const imageUrl = item.image_url ?? PLACEHOLDER_IMAGES[placeholderIndex];
  const seller = item.profiles;
  const typeColor = TYPE_COLORS[item.coral_type ?? ''] ?? TYPE_COLORS.Other;

  return (
    <button
      onClick={onClick}
      className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-600 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-black/10 dark:hover:shadow-black/40 hover:-translate-y-0.5 text-left w-full"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-800">
        <img
          src={imageUrl}
          alt={item.coral_type ?? 'Coral'}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGES[placeholderIndex]; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        <div className="absolute top-2 left-2">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${typeColor}`}>
            {item.coral_type ?? 'Unknown'}
          </span>
        </div>

        {item.asking_price != null && (
          <div className="absolute bottom-2 right-2">
            <span className="bg-black/70 text-white text-sm font-bold px-2 py-0.5 rounded-lg">
              ${item.asking_price.toLocaleString()}
            </span>
          </div>
        )}

        {item.asking_price == null && (
          <div className="absolute bottom-2 right-2">
            <span className="bg-black/60 text-orange-300 text-xs font-semibold px-2 py-0.5 rounded-lg flex items-center gap-1">
              <ArrowLeftRight size={10} />
              Trade
            </span>
          </div>
        )}
      </div>

      <div className="p-3.5">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <p className="text-slate-900 dark:text-white font-semibold text-sm leading-tight line-clamp-2 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
            {item.notes ?? item.coral_type ?? 'Coral'}
          </p>
          <span className="text-slate-400 dark:text-slate-500 text-xs flex-shrink-0 mt-0.5">
            Qty: {item.quantity}
          </span>
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
              {seller?.username?.[0]?.toUpperCase() ?? <User size={10} />}
            </div>
            <span className="text-slate-500 dark:text-slate-400 text-xs truncate">
              {seller?.username ?? 'Unknown'}
            </span>
            {seller?.role && seller.role !== 'hobbyist' && (
              <span className={`flex-shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                seller.role === 'farm'
                  ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400'
                  : 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400'
              }`}>
                {seller.role === 'farm' ? 'Farm' : 'Vendor'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {seller?.location_state && (
              <span className="text-slate-400 dark:text-slate-500 text-xs flex items-center gap-0.5">
                <MapPin size={9} />
                {seller.location_state}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
