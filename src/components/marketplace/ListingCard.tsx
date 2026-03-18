import { MapPin, Package, Truck, ArrowLeftRight, Camera } from 'lucide-react';
import { Listing } from '../../lib/supabase';
import RarityBadge from '../ui/RarityBadge';
import ReputationScore from '../ui/ReputationScore';

interface ListingCardProps {
  listing: Listing;
  onClick: () => void;
}

const PLACEHOLDER_IMAGES = [
  'https://images.pexels.com/photos/1618606/pexels-photo-1618606.jpeg?auto=compress&cs=tinysrgb&w=600',
  'https://images.pexels.com/photos/3224096/pexels-photo-3224096.jpeg?auto=compress&cs=tinysrgb&w=600',
  'https://images.pexels.com/photos/1108341/pexels-photo-1108341.jpeg?auto=compress&cs=tinysrgb&w=600',
  'https://images.pexels.com/photos/847393/pexels-photo-847393.jpeg?auto=compress&cs=tinysrgb&w=600',
];

export default function ListingCard({ listing, onClick }: ListingCardProps) {
  const primaryImage = listing.listing_images?.find(i => i.is_primary) ?? listing.listing_images?.[0];
  const placeholderIndex = listing.id.charCodeAt(0) % PLACEHOLDER_IMAGES.length;
  const imageUrl = primaryImage?.url ?? PLACEHOLDER_IMAGES[placeholderIndex];
  const rarity = listing.coral_morphs?.rarity_tier ?? listing.coral_species?.rarity_tier ?? 'Common';
  const seller = listing.profiles;

  return (
    <button
      onClick={onClick}
      className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-black/20 dark:hover:shadow-black/40 hover:-translate-y-0.5 text-left w-full"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-800">
        <img
          src={imageUrl}
          alt={listing.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Badges overlay */}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          <RarityBadge tier={rarity} />
        </div>

        <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
          {listing.is_wysiwyg && (
            <span className="bg-black/70 text-cyan-400 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
              <Camera size={9} />
              WYSIWYG
            </span>
          )}
          {listing.is_aquacultured && (
            <span className="bg-black/70 text-emerald-400 text-xs px-2 py-0.5 rounded-full">
              Aquacultured
            </span>
          )}
        </div>

        {/* Listing type */}
        <div className="absolute bottom-2 right-2">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            listing.listing_type === 'trade'
              ? 'bg-orange-500/90 text-white'
              : listing.listing_type === 'both'
              ? 'bg-purple-500/90 text-white'
              : 'bg-cyan-500/90 text-white'
          }`}>
            {listing.listing_type === 'sale' ? 'For Sale' : listing.listing_type === 'trade' ? 'Trade' : 'Sale/Trade'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-slate-900 dark:text-white font-semibold text-sm leading-tight mb-1 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors line-clamp-2">
          {listing.title}
        </h3>

        {listing.coral_species && (
          <p className="text-slate-400 dark:text-slate-500 text-xs mb-2 italic">
            {listing.coral_morphs ? listing.coral_morphs.morph_name + ' — ' : ''}
            {listing.coral_species.genus} {listing.coral_species.species}
          </p>
        )}

        <div className="flex items-center justify-between mt-2">
          <div>
            {listing.asking_price ? (
              <span className="text-slate-900 dark:text-white font-bold text-lg">${listing.asking_price.toLocaleString()}</span>
            ) : (
              <span className="text-orange-400 font-medium text-sm flex items-center gap-1">
                <ArrowLeftRight size={12} />
                Trade Only
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 text-xs">
            {listing.is_shipping_available && <Truck size={12} />}
            {listing.is_local_pickup && <Package size={12} />}
          </div>
        </div>

        {/* Seller + location */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
              {seller?.username?.[0]?.toUpperCase() ?? '?'}
            </div>
            <span className="text-slate-500 dark:text-slate-400 text-xs truncate max-w-[60px]">{seller?.username ?? 'Unknown'}</span>
            {seller && (
              <span className={`flex-shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
                seller.role === 'farm'
                  ? 'bg-emerald-900/50 text-emerald-400'
                  : seller.role === 'vendor'
                  ? 'bg-blue-900/50 text-blue-400'
                  : 'bg-amber-900/50 text-amber-400'
              }`}>
                {seller.role === 'farm' ? 'Farm' : seller.role === 'vendor' ? 'Vendor' : 'Hobbyist'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {seller && (
              <ReputationScore score={seller.reputation_score} totalReviews={seller.total_reviews} size="sm" />
            )}
            {(listing.location_city || listing.location_state) && (
              <span className="text-slate-400 dark:text-slate-500 text-xs flex items-center gap-0.5">
                <MapPin size={10} />
                {listing.location_city ? `${listing.location_city}, ` : ''}{listing.location_state}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
