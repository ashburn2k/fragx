import { useEffect, useState } from 'react';
import { Users, Circle, ArrowLeftRight, Heart, Inbox, TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface SidebarStats {
  totalMembers: number;
  onlineMembers: { id: string; username: string; display_name: string | null; last_seen_at: string }[];
  totalHaveItems: number;
  totalWantItems: number;
  totalTrades: number;
}

export default function TradeSidebar() {
  const [stats, setStats] = useState<SidebarStats>({
    totalMembers: 0,
    onlineMembers: [],
    totalHaveItems: 0,
    totalWantItems: 0,
    totalTrades: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  async function loadStats() {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

    const [membersRes, onlineRes, haveRes, wantRes, tradesRes] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase
        .from('profiles')
        .select('id, username, display_name, last_seen_at')
        .gte('last_seen_at', tenMinutesAgo)
        .order('last_seen_at', { ascending: false })
        .limit(20),
      supabase.from('have_list').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('want_list').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('trade_matches').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
    ]);

    setStats({
      totalMembers: membersRes.count ?? 0,
      onlineMembers: onlineRes.data ?? [],
      totalHaveItems: haveRes.count ?? 0,
      totalWantItems: wantRes.count ?? 0,
      totalTrades: tradesRes.count ?? 0,
    });
    setLoading(false);
  }

  const statItems = [
    { icon: Users, label: 'Members', value: stats.totalMembers },
    { icon: Heart, label: 'Have Listings', value: stats.totalHaveItems },
    { icon: Inbox, label: 'Want Requests', value: stats.totalWantItems },
    { icon: TrendingUp, label: 'Trades Done', value: stats.totalTrades },
  ];

  return (
    <div className="space-y-4 w-full">
      {/* Community Stats */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 transition-colors duration-200">
        <h3 className="text-slate-900 dark:text-white font-semibold text-sm mb-3 flex items-center gap-2">
          <ArrowLeftRight size={14} className="text-cyan-500" />
          Community Stats
        </h3>
        {loading ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {statItems.map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 rounded-xl px-3 py-2.5"
              >
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs">
                  <Icon size={13} />
                  {label}
                </div>
                <span className="text-slate-900 dark:text-white font-semibold text-sm tabular-nums">
                  {value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Online Now */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 transition-colors duration-200">
        <h3 className="text-slate-900 dark:text-white font-semibold text-sm mb-3 flex items-center gap-2">
          <Circle size={8} className="text-emerald-500 fill-emerald-500" />
          Online Now
          {stats.onlineMembers.length > 0 && (
            <span className="ml-auto bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-xs px-2 py-0.5 rounded-full font-medium">
              {stats.onlineMembers.length}
            </span>
          )}
        </h3>

        {loading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-9 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : stats.onlineMembers.length === 0 ? (
          <div className="text-center py-5">
            <p className="text-slate-400 dark:text-slate-500 text-xs">No members online right now</p>
            <p className="text-slate-300 dark:text-slate-600 text-xs mt-1">Check back soon</p>
          </div>
        ) : (
          <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
            {stats.onlineMembers.map(member => (
              <div key={member.id} className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <div className="relative flex-shrink-0">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center text-xs font-bold text-white">
                    {member.username[0].toUpperCase()}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-slate-800 dark:text-slate-200 text-xs font-medium truncate">
                    {member.display_name ?? member.username}
                  </div>
                  <div className="text-slate-400 dark:text-slate-500 text-[10px] truncate">
                    @{member.username}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
