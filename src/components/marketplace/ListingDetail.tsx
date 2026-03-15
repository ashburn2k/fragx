import { useState } from 'react';
import { ArrowLeft, MapPin, Truck, Package, Camera, Droplets, Sun, ChevronLeft, ChevronRight, Flag, MessageSquare, Heart } from 'lucide-react';
import { Listing, supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import RarityBadge from '../ui/RarityBadge';
import ReputationScore from '../ui/ReputationScore';

const PLACEHOLDER = 'https://images.pexels.com/photos/1618606/pexels-photo-1618606.jpeg?auto=compress&cs=tinysrgb&w=800';

interface ListingDetailProps {
  listing: Listing;
  onBack: () => void;
  onRefresh: () => void;
}

export default function ListingDetail({ listing, onBack, onRefresh }: ListingDetailProps) {
  const { user } = useAuth();
  const [imgIdx, setImgIdx] = useState(0);
  const [showContact, setShowContact] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [flagging, setFlagging] = useState(false);

  const images = listing.listing_images ?? [];
  const currentImg = images[imgIdx]?.url ?? PLACEHOLDER;
  const rarity = listing.coral_morphs?.rarity_tier ?? listing.coral_species?.rarity_tier ?? 'Common';
  const seller = listing.profiles;

  async function handleMarkSold() {
    await supabase.from('listings').update({ status: 'sold' }).eq('id', listing.id);
    onRefresh();
    onBack();
  }

  async function handleSendMessage() {
    if (!user || !message.trim()) return;
    setSending(true);
    await supabase.from('messages').insert({
      sender_id: user.id,
      recipient_id: listing.seller_id,
      listing_id: listing.id,
      content: message.trim(),
    });
    setSending(false);
    setSent(true);
    setMessage('');
  }

  async function handleFlag() {
    if (!user) return;
    setFlagging(true);
    await supabase.from('flags').insert({
      flagger_id: user.id,
      listing_id: listing.id,
      reason: 'fake_listing',
    });
    setFlagging(false);
  }

  return (
    <div>
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4 group"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
        Back to listings
      </button>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Images */}
        <div className="space-y-3">
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-800 group">
            <img src={currentImg} alt={listing.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

            {images.length > 1 && (
              <>
                <button
                  onClick={() => setImgIdx(i => Math.max(0, i - 1))}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white transition-all opacity-0 group-hover:opacity-100"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() => setImgIdx(i => Math.min(images.length - 1, i + 1))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white transition-all opacity-0 group-hover:opacity-100"
                >
                  <ChevronRight size={18} />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setImgIdx(i)}
                      className={`w-1.5 h-1.5 rounded-full transition-all ${i === imgIdx ? 'bg-white w-4' : 'bg-white/40'}`}
                    />
                  ))}
                </div>
              </>
            )}

            <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
              <RarityBadge tier={rarity} size="md" />
            </div>

            {listing.is_wysiwyg && (
              <div className="absolute top-3 right-3 bg-black/70 text-cyan-400 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                <Camera size={10} />
                WYSIWYG
              </div>
            )}
          </div>

          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setImgIdx(i)}
                  className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                    i === imgIdx ? 'border-cyan-500' : 'border-slate-700 hover:border-slate-500'
                  }`}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-5">
          <div>
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-2xl font-bold text-white leading-tight">{listing.title}</h1>
              <button className="text-slate-500 hover:text-red-400 transition-colors flex-shrink-0 p-1">
                <Heart size={20} />
              </button>
            </div>

            {listing.coral_species && (
              <p className="text-slate-400 text-sm mt-1 italic">
                {listing.coral_morphs && <span className="text-cyan-400 font-medium">{listing.coral_morphs.morph_name} — </span>}
                {listing.coral_species.genus} {listing.coral_species.species}
                {listing.coral_species.common_name && ` (${listing.coral_species.common_name})`}
              </p>
            )}

            <div className="flex flex-wrap gap-2 mt-3">
              {listing.is_aquacultured && (
                <span className="bg-emerald-900/40 text-emerald-400 border border-emerald-800 text-xs px-2 py-0.5 rounded-full">
                  Aquacultured
                </span>
              )}
              {listing.is_beginner_friendly && (
                <span className="bg-blue-900/40 text-blue-400 border border-blue-800 text-xs px-2 py-0.5 rounded-full">
                  Beginner Friendly
                </span>
              )}
              {listing.frag_size && (
                <span className="bg-slate-700 text-slate-300 text-xs px-2 py-0.5 rounded-full">
                  Frag: {listing.frag_size}
                </span>
              )}
            </div>
          </div>

          {/* Price */}
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-slate-400 text-xs mb-1 uppercase tracking-wider">
                  {listing.listing_type === 'trade' ? 'Trade' : listing.listing_type === 'both' ? 'Sale / Trade' : 'Asking Price'}
                </div>
                {listing.asking_price ? (
                  <div className="text-3xl font-bold text-white">${listing.asking_price.toLocaleString()}</div>
                ) : (
                  <div className="text-xl font-semibold text-orange-400">Trade Only</div>
                )}
                {listing.trade_for && (
                  <div className="text-slate-400 text-sm mt-1">Looking for: <span className="text-slate-300">{listing.trade_for}</span></div>
                )}
              </div>
              <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                listing.listing_type === 'trade'
                  ? 'bg-orange-500/20 text-orange-400'
                  : listing.listing_type === 'both'
                  ? 'bg-purple-500/20 text-purple-400'
                  : 'bg-cyan-500/20 text-cyan-400'
              }`}>
                {listing.listing_type === 'sale' ? 'For Sale' : listing.listing_type === 'trade' ? 'Trade' : 'Sale/Trade'}
              </span>
            </div>
          </div>

          {/* Care requirements */}
          {(listing.light_requirement || listing.flow_requirement || listing.care_difficulty) && (
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 space-y-3">
              <h3 className="text-slate-400 text-xs uppercase tracking-wider font-medium">Care Requirements</h3>
              <div className="grid grid-cols-3 gap-3">
                {listing.care_difficulty && (
                  <div className="text-center">
                    <div className="text-white font-medium text-sm">{listing.care_difficulty}</div>
                    <div className="text-slate-500 text-xs mt-0.5">Difficulty</div>
                  </div>
                )}
                {listing.light_requirement && (
                  <div className="text-center">
                    <Sun size={16} className="text-amber-400 mx-auto mb-1" />
                    <div className="text-white font-medium text-sm">{listing.light_requirement}</div>
                    <div className="text-slate-500 text-xs mt-0.5">Light</div>
                  </div>
                )}
                {listing.flow_requirement && (
                  <div className="text-center">
                    <Droplets size={16} className="text-cyan-400 mx-auto mb-1" />
                    <div className="text-white font-medium text-sm">{listing.flow_requirement}</div>
                    <div className="text-slate-500 text-xs mt-0.5">Flow</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Shipping */}
          <div className="flex gap-3">
            {listing.is_shipping_available && (
              <div className="flex-1 bg-slate-900 border border-slate-700 rounded-xl p-3 flex items-center gap-2">
                <Truck size={16} className="text-cyan-400" />
                <span className="text-slate-300 text-sm">Ships nationwide</span>
              </div>
            )}
            {listing.is_local_pickup && (
              <div className="flex-1 bg-slate-900 border border-slate-700 rounded-xl p-3 flex items-center gap-2">
                <Package size={16} className="text-teal-400" />
                <div>
                  <span className="text-slate-300 text-sm">Local pickup</span>
                  {(listing.location_city || listing.location_state) && (
                    <div className="flex items-center gap-1 text-slate-500 text-xs mt-0.5">
                      <MapPin size={10} />
                      {listing.location_city}{listing.location_city && listing.location_state ? ', ' : ''}{listing.location_state}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          {listing.description && (
            <div>
              <h3 className="text-slate-400 text-xs uppercase tracking-wider font-medium mb-2">Description</h3>
              <p className="text-slate-300 text-sm leading-relaxed">{listing.description}</p>
            </div>
          )}

          {/* Seller */}
          {seller && (
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center text-lg font-bold text-white flex-shrink-0">
                {seller.username[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white font-semibold">{seller.display_name ?? seller.username}</div>
                <div className="text-slate-400 text-xs">@{seller.username} · {seller.role}</div>
                <ReputationScore score={seller.reputation_score} totalReviews={seller.total_reviews} size="sm" />
              </div>
              <div className="flex flex-col gap-1 text-xs text-slate-500">
                <div>{seller.total_sales} sales</div>
                <div>{seller.total_trades} trades</div>
              </div>
            </div>
          )}

          {/* Actions */}
          {user && user.id !== listing.seller_id && (
            <div className="space-y-3">
              {!showContact ? (
                <button
                  onClick={() => setShowContact(true)}
                  className="w-full bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-400 hover:to-teal-500 text-white font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <MessageSquare size={16} />
                  Contact Seller
                </button>
              ) : sent ? (
                <div className="w-full bg-emerald-900/30 border border-emerald-700 text-emerald-400 py-3 rounded-xl text-center text-sm font-medium">
                  Message sent!
                </div>
              ) : (
                <div className="space-y-2">
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Hi, I'm interested in this coral..."
                    rows={3}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors text-sm resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowContact(false)}
                      className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-2.5 rounded-xl transition-colors text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSendMessage}
                      disabled={sending || !message.trim()}
                      className="flex-1 bg-gradient-to-r from-cyan-500 to-teal-600 text-white font-semibold py-2.5 rounded-xl transition-all disabled:opacity-50 text-sm"
                    >
                      {sending ? 'Sending...' : 'Send'}
                    </button>
                  </div>
                </div>
              )}
              <button
                onClick={handleFlag}
                disabled={flagging}
                className="w-full flex items-center justify-center gap-2 text-slate-500 hover:text-red-400 transition-colors text-xs py-2"
              >
                <Flag size={12} />
                {flagging ? 'Reported' : 'Report listing'}
              </button>
            </div>
          )}

          {user && user.id === listing.seller_id && (
            <button
              onClick={handleMarkSold}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-xl transition-all duration-200"
            >
              Mark as Sold
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
