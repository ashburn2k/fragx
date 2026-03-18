import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Shield, Flag, ShoppingBag, Users, CheckCircle, XCircle, Eye } from 'lucide-react';

interface FlaggedItem {
  id: string;
  reason: string;
  notes: string | null;
  is_resolved: boolean;
  created_at: string;
  flagger_id: string;
  listing_id: string | null;
  listings?: { title: string; seller_id: string };
}

interface AdminStats {
  totalListings: number;
  activeListings: number;
  totalUsers: number;
  openFlags: number;
}

export default function AdminPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats>({ totalListings: 0, activeListings: 0, totalUsers: 0, openFlags: 0 });
  const [flags, setFlags] = useState<FlaggedItem[]>([]);
  const [listings, setListings] = useState<{ id: string; title: string; status: string; seller?: { username: string }; created_at: string }[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'flags' | 'listings' | 'users'>('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadAdmin();
  }, [user]);

  async function loadAdmin() {
    setLoading(true);
    const [listingCount, activeCount, userCount, flagCount, flagsData, listingsData] = await Promise.all([
      supabase.from('listings').select('id', { count: 'exact', head: true }),
      supabase.from('listings').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('flags').select('id', { count: 'exact', head: true }).eq('is_resolved', false),
      supabase.from('flags').select('*, listings(title, seller_id)').order('created_at', { ascending: false }).limit(20),
      supabase.from('listings').select('*, seller:seller_id(username)').order('created_at', { ascending: false }).limit(30),
    ]);

    setStats({
      totalListings: listingCount.count ?? 0,
      activeListings: activeCount.count ?? 0,
      totalUsers: userCount.count ?? 0,
      openFlags: flagCount.count ?? 0,
    });
    setFlags(flagsData.data ?? []);
    setListings(listingsData.data ?? []);
    setLoading(false);
  }

  async function resolveFlag(id: string) {
    await supabase.from('flags').update({ is_resolved: true }).eq('id', id);
    loadAdmin();
  }

  async function removeListing(id: string) {
    await supabase.from('listings').update({ status: 'removed' }).eq('id', id);
    loadAdmin();
  }

  if (!user) return null;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-700 flex items-center justify-center">
          <Shield size={18} className="text-red-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Admin Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Moderation & platform management</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          { id: 'overview' as const, label: 'Overview' },
          { id: 'flags' as const, label: 'Flags', count: stats.openFlags },
          { id: 'listings' as const, label: 'Listings' },
          { id: 'users' as const, label: 'Users' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              activeTab === tab.id ? 'bg-red-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl h-24 animate-pulse" />)}
        </div>
      ) : (
        <>
          {activeTab === 'overview' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Total Listings', value: stats.totalListings, Icon: ShoppingBag, color: 'text-cyan-400' },
                  { label: 'Active Listings', value: stats.activeListings, Icon: Eye, color: 'text-emerald-400' },
                  { label: 'Registered Users', value: stats.totalUsers, Icon: Users, color: 'text-blue-400' },
                  { label: 'Open Flags', value: stats.openFlags, Icon: Flag, color: 'text-red-400' },
                ].map(({ label, value, Icon, color }) => (
                  <div key={label} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 transition-colors duration-200">
                    <Icon size={20} className={color} />
                    <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{value}</div>
                    <div className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">{label}</div>
                  </div>
                ))}
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 transition-colors duration-200">
                <h3 className="text-slate-900 dark:text-white font-semibold mb-3">Platform Health</h3>
                <div className="space-y-2">
                  {[
                    { label: 'Active listing rate', value: stats.totalListings > 0 ? Math.round((stats.activeListings / stats.totalListings) * 100) : 0, color: 'bg-cyan-500' },
                    { label: 'Flag resolution rate', value: stats.openFlags === 0 ? 100 : 70, color: 'bg-emerald-500' },
                  ].map(item => (
                    <div key={item.label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-500 dark:text-slate-400">{item.label}</span>
                        <span className="text-slate-900 dark:text-white font-medium">{item.value}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.value}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'flags' && (
            <div className="space-y-3">
              <p className="text-slate-500 dark:text-slate-400 text-sm">{stats.openFlags} open flags requiring review</p>
              {flags.filter(f => !f.is_resolved).length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
                  <CheckCircle size={32} className="text-emerald-500 mx-auto mb-3" />
                  <p className="text-emerald-400 font-medium">All clear!</p>
                  <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">No open flags to review</p>
                </div>
              ) : flags.filter(f => !f.is_resolved).map(flag => (
                <div key={flag.id} className="bg-white dark:bg-slate-900 border border-red-900/50 rounded-xl p-4 space-y-3 transition-colors duration-200">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Flag size={14} className="text-red-400" />
                        <span className="text-slate-900 dark:text-white font-medium text-sm capitalize">{flag.reason.replace('_', ' ')}</span>
                      </div>
                      {flag.listings && (
                        <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                          Listing: <span className="text-slate-700 dark:text-slate-300">{flag.listings.title}</span>
                        </p>
                      )}
                      {flag.notes && <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">"{flag.notes}"</p>}
                      <p className="text-slate-400 dark:text-slate-600 text-xs mt-1">{new Date(flag.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => resolveFlag(flag.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-900 py-2 rounded-xl text-xs font-medium transition-all"
                    >
                      <CheckCircle size={12} />
                      Resolve
                    </button>
                    {flag.listing_id && (
                      <button
                        onClick={() => removeListing(flag.listing_id!)}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-900 py-2 rounded-xl text-xs font-medium transition-all"
                      >
                        <XCircle size={12} />
                        Remove Listing
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'listings' && (
            <div className="space-y-2">
              {listings.map(listing => (
                <div key={listing.id} className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 transition-colors duration-200">
                  <div>
                    <div className="text-slate-900 dark:text-white text-sm font-medium line-clamp-1">{listing.title}</div>
                    <div className="text-slate-400 dark:text-slate-500 text-xs mt-0.5">
                      by @{(listing.seller as { username: string })?.username} · {new Date(listing.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      listing.status === 'active' ? 'bg-emerald-900/40 text-emerald-400' :
                      listing.status === 'removed' ? 'bg-red-900/40 text-red-400' :
                      'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                    }`}>
                      {listing.status}
                    </span>
                    {listing.status === 'active' && (
                      <button
                        onClick={() => removeListing(listing.id)}
                        className="text-slate-500 hover:text-red-400 transition-colors"
                        title="Remove listing"
                      >
                        <XCircle size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'users' && (
            <div className="text-center py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
              <Users size={32} className="text-slate-400 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400 text-sm">User management coming soon</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
