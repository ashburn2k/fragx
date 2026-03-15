import { useEffect, useState } from 'react';
import { supabase, Badge, Review, Listing } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { User, Store, Sprout, CreditCard as Edit3, Check, X, ShieldCheck, Star, MessageSquare } from 'lucide-react';
import ReputationScore from '../components/ui/ReputationScore';
import ListingCard from '../components/marketplace/ListingCard';

const roleIcons: Record<string, typeof User> = { hobbyist: User, vendor: Store, farm: Sprout };
const badgeColors: Record<string, string> = {
  '#22c55e': 'text-emerald-400',
  '#3b82f6': 'text-blue-400',
  '#f59e0b': 'text-amber-400',
  '#ef4444': 'text-red-400',
  '#10b981': 'text-emerald-400',
  '#06b6d4': 'text-cyan-400',
  '#8b5cf6': 'text-violet-400',
  '#f97316': 'text-orange-400',
};

interface ProfilePageProps {
  onListingClick: (listing: Listing) => void;
}

export default function ProfilePage({ onListingClick }: ProfilePageProps) {
  const { user, profile, refreshProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [editForm, setEditForm] = useState({
    display_name: '',
    bio: '',
    location_city: '',
    location_state: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user || !profile) return;
    setEditForm({
      display_name: profile.display_name ?? '',
      bio: profile.bio ?? '',
      location_city: profile.location_city ?? '',
      location_state: profile.location_state ?? '',
    });
    loadProfileData();
  }, [user, profile]);

  async function loadProfileData() {
    if (!user) return;
    setLoading(true);
    const [badgeRes, reviewRes, listingRes] = await Promise.all([
      supabase.from('user_badges').select('badge_id, badges(*)').eq('user_id', user.id),
      supabase.from('reviews').select('*, reviewer:reviewer_id(username, avatar_url)').eq('reviewed_id', user.id).order('created_at', { ascending: false }),
      supabase.from('listings').select('*, coral_species(*), coral_morphs(*), listing_images(*)').eq('seller_id', user.id).order('created_at', { ascending: false }),
    ]);
    setBadges((badgeRes.data ?? []).map((b: { badge_id: string; badges: Badge | Badge[] }) => Array.isArray(b.badges) ? b.badges[0] : b.badges).filter(Boolean));
    setReviews(reviewRes.data ?? []);
    setListings(listingRes.data ?? []);
    setLoading(false);
  }

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    await supabase.from('profiles').update({
      display_name: editForm.display_name || null,
      bio: editForm.bio || null,
      location_city: editForm.location_city || null,
      location_state: editForm.location_state || null,
      updated_at: new Date().toISOString(),
    }).eq('id', user.id);
    await refreshProfile();
    setSaving(false);
    setEditing(false);
  }

  if (!user || !profile) {
    return (
      <div className="text-center py-20">
        <User size={40} className="text-slate-600 mx-auto mb-3" />
        <p className="text-slate-400">Sign in to view your profile</p>
      </div>
    );
  }

  const RoleIcon = roleIcons[profile.role] ?? User;
  const activeListings = listings.filter(l => l.status === 'active');

  return (
    <div className="space-y-6">
      {/* Profile header */}
      <div className="bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-cyan-900/40 via-teal-900/30 to-slate-900" />
        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-10 mb-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center text-3xl font-bold text-white border-4 border-slate-900">
              {profile.username[0].toUpperCase()}
            </div>
            <button
              onClick={() => editing ? handleSave() : setEditing(true)}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-3 py-1.5 rounded-xl text-sm font-medium transition-all"
            >
              {editing ? <><Check size={14} /> {saving ? 'Saving...' : 'Save'}</> : <><Edit3 size={14} /> Edit</>}
            </button>
          </div>

          {editing ? (
            <div className="space-y-3">
              <input
                value={editForm.display_name}
                onChange={e => setEditForm(f => ({ ...f, display_name: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-sm"
                placeholder="Display name"
              />
              <textarea
                value={editForm.bio}
                onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))}
                rows={2}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-sm resize-none"
                placeholder="Bio"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={editForm.location_city}
                  onChange={e => setEditForm(f => ({ ...f, location_city: e.target.value }))}
                  className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-sm"
                  placeholder="City"
                />
                <input
                  value={editForm.location_state}
                  onChange={e => setEditForm(f => ({ ...f, location_state: e.target.value }))}
                  maxLength={2}
                  className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-sm"
                  placeholder="State"
                />
              </div>
              <button
                onClick={() => setEditing(false)}
                className="text-slate-400 hover:text-white text-sm transition-colors flex items-center gap-1"
              >
                <X size={12} />Cancel
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-white">{profile.display_name ?? profile.username}</h1>
                {profile.is_verified && (
                  <ShieldCheck size={18} className="text-cyan-400" aria-label="Verified" />
                )}
              </div>
              <p className="text-slate-400 text-sm">@{profile.username}</p>

              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1 rounded-lg text-xs text-slate-300">
                  <RoleIcon size={12} />
                  {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                </span>
                {(profile.location_city || profile.location_state) && (
                  <span className="text-slate-500 text-xs">
                    {profile.location_city}{profile.location_city && profile.location_state ? ', ' : ''}{profile.location_state}
                  </span>
                )}
              </div>

              {profile.bio && <p className="text-slate-300 text-sm mt-3">{profile.bio}</p>}
            </>
          )}

          {/* Reputation */}
          <div className="mt-4">
            <ReputationScore score={profile.reputation_score} totalReviews={profile.total_reviews} size="lg" />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            {[
              { label: 'Sales', value: profile.total_sales },
              { label: 'Trades', value: profile.total_trades },
              { label: 'Reviews', value: profile.total_reviews },
            ].map(s => (
              <div key={s.label} className="bg-slate-800 rounded-xl p-3 text-center">
                <div className="text-white font-bold text-lg">{s.value}</div>
                <div className="text-slate-400 text-xs">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Badges */}
      {badges.length > 0 && (
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-3">Badges</h3>
          <div className="flex flex-wrap gap-2">
            {badges.map(badge => (
              <div
                key={badge.id}
                className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2"
                title={badge.description ?? ''}
              >
                <span className={`text-sm ${badgeColors[badge.color ?? ''] ?? 'text-cyan-400'}`}>
                  ★
                </span>
                <span className="text-white text-sm font-medium">{badge.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Listings */}
      {!loading && activeListings.length > 0 && (
        <div>
          <h3 className="text-white font-semibold mb-3">Active Listings ({activeListings.length})</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {activeListings.map(l => (
              <ListingCard key={l.id} listing={l} onClick={() => onListingClick(l)} />
            ))}
          </div>
        </div>
      )}

      {/* Reviews */}
      <div>
        <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
          <Star size={16} className="text-amber-400" />
          Reviews ({reviews.length})
        </h3>
        {reviews.length === 0 ? (
          <div className="text-center py-8 bg-slate-900 border border-slate-800 rounded-2xl">
            <MessageSquare size={28} className="text-slate-600 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">No reviews yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map(review => (
              <div key={review.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center text-xs font-bold text-white">
                      {(review.reviewer as { username: string })?.username?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <span className="text-slate-300 text-sm font-medium">{(review.reviewer as { username: string })?.username}</span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Star key={i} size={12} className={i <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-600'} />
                    ))}
                  </div>
                </div>
                {review.comment && <p className="text-slate-400 text-sm">{review.comment}</p>}
                <p className="text-slate-600 text-xs mt-2">{new Date(review.created_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
