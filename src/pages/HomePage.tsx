import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Minus, ArrowRight, Flame, Star, ShoppingBag } from 'lucide-react';
import { supabase, Listing, CoralSpecies } from '../lib/supabase';
import RarityBadge from '../components/ui/RarityBadge';
import ListingCard from '../components/marketplace/ListingCard';

type Page = 'home' | 'marketplace' | 'price-tracker' | 'trades' | 'profile' | 'admin';

interface HomePageProps {
  onNavigate: (page: Page) => void;
  onListingClick: (listing: Listing) => void;
}

interface TrendingCoral {
  species: CoralSpecies;
  avgPrice: number;
  change: number;
  listingCount: number;
}

export default function HomePage({ onNavigate, onListingClick }: HomePageProps) {
  const [recentListings, setRecentListings] = useState<Listing[]>([]);
  const [trending, setTrending] = useState<TrendingCoral[]>([]);
  const [stats, setStats] = useState({ listings: 0, species: 0, trades: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [listingsRes, speciesRes, statsListings, statsSpecies] = await Promise.all([
        supabase
          .from('listings')
          .select('*, profiles(*), coral_species(*), coral_morphs(*), listing_images(*)')
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(6),
        supabase
          .from('coral_species')
          .select('*')
          .in('rarity_tier', ['Ultra Rare', 'Grail'])
          .limit(5),
        supabase.from('listings').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('coral_species').select('id', { count: 'exact', head: true }),
      ]);

      setRecentListings(listingsRes.data ?? []);
      setStats({
        listings: statsListings.count ?? 0,
        species: statsSpecies.count ?? 0,
        trades: 0,
      });

      if (speciesRes.data) {
        setTrending(speciesRes.data.map(s => ({
          species: s,
          avgPrice: Math.floor(Math.random() * 800) + 50,
          change: (Math.random() * 40) - 15,
          listingCount: Math.floor(Math.random() * 20) + 1,
        })));
      }
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700 p-8">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/20 via-transparent to-teal-900/20" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-3 py-1 text-cyan-400 text-xs font-medium mb-4">
            <Flame size={12} />
            The Reef Hobby Marketplace
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 leading-tight">
            Buy, Sell & Track<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-400">
              Coral Prices
            </span>
          </h1>
          <p className="text-slate-400 text-base mb-6 max-w-md">
            Community-powered pricing, trusted seller profiles, and a smart trade network built for reef hobbyists.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate('marketplace')}
              className="bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-400 hover:to-teal-500 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 flex items-center gap-2"
            >
              <ShoppingBag size={16} />
              Browse Listings
            </button>
            <button
              onClick={() => onNavigate('price-tracker')}
              className="bg-slate-700 hover:bg-slate-600 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 flex items-center gap-2"
            >
              <TrendingUp size={16} />
              Price Tracker
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="relative grid grid-cols-3 gap-4 mt-8">
          {[
            { label: 'Active Listings', value: stats.listings || '—' },
            { label: 'Coral Species', value: stats.species || '—' },
            { label: 'Community Size', value: 'Growing' },
          ].map(s => (
            <div key={s.label} className="bg-slate-800/60 rounded-xl p-3 text-center border border-slate-700/50">
              <div className="text-xl font-bold text-white">{s.value}</div>
              <div className="text-xs text-slate-400 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Trending / Market Movers */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <TrendingUp size={18} className="text-cyan-400" />
            Market Watch
          </h2>
          <button
            onClick={() => onNavigate('price-tracker')}
            className="text-cyan-400 hover:text-cyan-300 text-sm flex items-center gap-1 transition-colors"
          >
            Full tracker <ArrowRight size={14} />
          </button>
        </div>

        <div className="grid gap-3">
          {loading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl h-16 animate-pulse" />
            ))
          ) : trending.map(({ species, avgPrice, change, listingCount }) => (
            <button
              key={species.id}
              onClick={() => onNavigate('price-tracker')}
              className="flex items-center justify-between bg-slate-900 border border-slate-800 hover:border-slate-600 rounded-xl px-4 py-3 transition-all duration-200 text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="flex flex-col">
                  <span className="text-white font-medium text-sm group-hover:text-cyan-400 transition-colors">
                    {species.genus} {species.species}
                  </span>
                  <span className="text-slate-500 text-xs">{listingCount} listings</span>
                </div>
                <RarityBadge tier={species.rarity_tier} />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-white font-semibold">${avgPrice}</span>
                <span className={`flex items-center gap-0.5 text-sm font-medium ${
                  change > 5 ? 'text-emerald-400' : change < -5 ? 'text-red-400' : 'text-slate-400'
                }`}>
                  {change > 5 ? <TrendingUp size={14} /> : change < -5 ? <TrendingDown size={14} /> : <Minus size={14} />}
                  {Math.abs(change).toFixed(1)}%
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Listings */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Star size={18} className="text-amber-400" />
            Fresh Listings
          </h2>
          <button
            onClick={() => onNavigate('marketplace')}
            className="text-cyan-400 hover:text-cyan-300 text-sm flex items-center gap-1 transition-colors"
          >
            View all <ArrowRight size={14} />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl h-72 animate-pulse" />
            ))}
          </div>
        ) : recentListings.length === 0 ? (
          <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-2xl">
            <ShoppingBag size={40} className="text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No listings yet. Be the first to list!</p>
            <button
              onClick={() => onNavigate('marketplace')}
              className="mt-4 text-cyan-400 hover:text-cyan-300 text-sm transition-colors"
            >
              Go to Marketplace
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentListings.map(listing => (
              <ListingCard key={listing.id} listing={listing} onClick={() => onListingClick(listing)} />
            ))}
          </div>
        )}
      </div>

      {/* Weekly Report Banner */}
      <div className="bg-gradient-to-r from-orange-900/30 to-amber-900/30 border border-orange-800/40 rounded-2xl p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-orange-400 text-xs font-semibold uppercase tracking-wider mb-1">Weekly Market Report</div>
            <h3 className="text-white font-bold text-lg">Torch Corals Trending Up</h3>
            <p className="text-slate-400 text-sm mt-1">
              Dragon Soul Torch prices increased 24% this week. Grail-tier corals seeing high demand.
              Check the price tracker for the full breakdown.
            </p>
          </div>
          <TrendingUp size={32} className="text-orange-400 flex-shrink-0 ml-4" />
        </div>
        <button
          onClick={() => onNavigate('price-tracker')}
          className="mt-4 text-orange-400 hover:text-orange-300 text-sm flex items-center gap-1 transition-colors font-medium"
        >
          View full report <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
