import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import {
  Users, Search, Ban, Trash2, Shield, ShieldCheck, ShieldOff,
  ChevronDown, X, AlertTriangle, CheckCircle, UserCheck, RefreshCw
} from 'lucide-react';

type UserRole = 'hobbyist' | 'vendor' | 'farm' | 'moderator';

interface ManagedUser {
  id: string;
  username: string;
  display_name: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  is_banned: boolean;
  ban_reason: string | null;
  banned_at: string | null;
  reputation_score: number;
  total_trades: number;
  total_sales: number;
  created_at: string;
  last_seen_at: string | null;
}

type ModalMode = 'ban' | 'delete' | 'promote' | null;

const ROLE_LABELS: Record<UserRole, string> = {
  hobbyist: 'Hobbyist',
  vendor: 'Vendor',
  farm: 'Farm',
  moderator: 'Moderator',
};

const ROLE_COLORS: Record<UserRole, string> = {
  hobbyist: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
  vendor: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400',
  farm: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400',
  moderator: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400',
};

export default function UserControlPanel() {
  const { user: adminUser } = useAuth();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'banned' | 'moderator'>('all');
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [banReason, setBanReason] = useState('');
  const [promoteRole, setPromoteRole] = useState<UserRole>('moderator');
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(t);
    }
  }, [toast]);

  async function loadUsers() {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('id, username, display_name, full_name, avatar_url, role, is_banned, ban_reason, banned_at, reputation_score, total_trades, total_sales, created_at, last_seen_at')
      .order('created_at', { ascending: false });
    setUsers((data ?? []) as ManagedUser[]);
    setLoading(false);
  }

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ message, type });
  }

  function openModal(user: ManagedUser, mode: ModalMode) {
    setSelectedUser(user);
    setModalMode(mode);
    setBanReason('');
    setPromoteRole('moderator');
  }

  function closeModal() {
    setSelectedUser(null);
    setModalMode(null);
    setBanReason('');
  }

  async function handleBan() {
    if (!selectedUser || !adminUser) return;
    setActionLoading(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        is_banned: true,
        ban_reason: banReason.trim() || null,
        banned_at: new Date().toISOString(),
        banned_by: adminUser.id,
      })
      .eq('id', selectedUser.id);
    setActionLoading(false);
    closeModal();
    if (error) {
      showToast('Failed to ban user', 'error');
    } else {
      showToast(`@${selectedUser.username} has been banned`, 'success');
      loadUsers();
    }
  }

  async function handleUnban() {
    if (!selectedUser) return;
    setActionLoading(true);
    const { error } = await supabase
      .from('profiles')
      .update({ is_banned: false, ban_reason: null, banned_at: null, banned_by: null })
      .eq('id', selectedUser.id);
    setActionLoading(false);
    closeModal();
    if (error) {
      showToast('Failed to unban user', 'error');
    } else {
      showToast(`@${selectedUser.username} has been unbanned`, 'success');
      loadUsers();
    }
  }

  async function handleDelete() {
    if (!selectedUser) return;
    setActionLoading(true);
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', selectedUser.id);
    setActionLoading(false);
    closeModal();
    if (error) {
      showToast('Failed to delete user', 'error');
    } else {
      showToast(`@${selectedUser.username} has been deleted`, 'success');
      loadUsers();
    }
  }

  async function handlePromote() {
    if (!selectedUser) return;
    setActionLoading(true);
    const { error } = await supabase
      .from('profiles')
      .update({ role: promoteRole })
      .eq('id', selectedUser.id);
    setActionLoading(false);
    closeModal();
    if (error) {
      showToast('Failed to update role', 'error');
    } else {
      showToast(`@${selectedUser.username} is now ${ROLE_LABELS[promoteRole]}`, 'success');
      loadUsers();
    }
  }

  const filtered = users.filter(u => {
    const matchesSearch =
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      (u.display_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (u.full_name ?? '').toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filter === 'all' ||
      (filter === 'banned' && u.is_banned) ||
      (filter === 'moderator' && u.role === 'moderator');
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-4">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by username or name..."
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'banned', 'moderator'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-all capitalize ${
                filter === f
                  ? 'bg-red-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
          <button
            onClick={loadUsers}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"
            title="Refresh"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      <p className="text-slate-400 dark:text-slate-500 text-xs">{filtered.length} user{filtered.length !== 1 ? 's' : ''}</p>

      {loading ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
          <Users size={28} className="text-slate-400 dark:text-slate-600 mx-auto mb-2" />
          <p className="text-slate-400 dark:text-slate-500 text-sm">No users found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(u => (
            <div
              key={u.id}
              className={`bg-white dark:bg-slate-900 border rounded-xl px-4 py-3 transition-colors duration-200 ${
                u.is_banned
                  ? 'border-red-200 dark:border-red-900/50'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 flex-shrink-0 overflow-hidden">
                  {u.avatar_url ? (
                    <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-500 dark:text-slate-400 text-sm font-bold uppercase">
                      {u.username[0]}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-slate-900 dark:text-white text-sm font-medium">
                      @{u.username}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[u.role]}`}>
                      {ROLE_LABELS[u.role]}
                    </span>
                    {u.is_banned && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 font-medium flex items-center gap-1">
                        <Ban size={10} />
                        Banned
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400 dark:text-slate-500 flex-wrap">
                    <span>{u.total_trades} trades</span>
                    <span>{u.total_sales} sales</span>
                    <span>rep {Number(u.reputation_score).toFixed(1)}</span>
                    <span>joined {new Date(u.created_at).toLocaleDateString()}</span>
                  </div>
                  {u.is_banned && u.ban_reason && (
                    <p className="text-xs text-red-400 dark:text-red-500 mt-0.5 italic">Reason: {u.ban_reason}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => openModal(u, 'promote')}
                    title="Change role"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-500/10 transition-all"
                  >
                    <ShieldCheck size={15} />
                  </button>
                  {u.is_banned ? (
                    <button
                      onClick={() => { setSelectedUser(u); handleUnbanDirect(u); }}
                      title="Unban user"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-emerald-500/10 transition-all"
                    >
                      <ShieldOff size={15} />
                    </button>
                  ) : (
                    <button
                      onClick={() => openModal(u, 'ban')}
                      title="Ban user"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-all"
                    >
                      <Ban size={15} />
                    </button>
                  )}
                  <button
                    onClick={() => openModal(u, 'delete')}
                    title="Delete user"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-all"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalMode && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5">
            <button onClick={closeModal} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
              <X size={18} />
            </button>

            {modalMode === 'ban' && (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                    <Ban size={18} className="text-red-500" />
                  </div>
                  <div>
                    <h3 className="text-slate-900 dark:text-white font-semibold">Ban User</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">@{selectedUser.username}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 text-xs font-medium mb-1.5">Reason (optional)</label>
                  <textarea
                    value={banReason}
                    onChange={e => setBanReason(e.target.value)}
                    placeholder="Explain why this user is being banned..."
                    rows={3}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 resize-none transition-all"
                  />
                </div>
                <div className="flex gap-2">
                  <button onClick={closeModal} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                    Cancel
                  </button>
                  <button
                    onClick={handleBan}
                    disabled={actionLoading}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-medium transition-all"
                  >
                    <Ban size={14} />
                    {actionLoading ? 'Banning...' : 'Ban User'}
                  </button>
                </div>
              </>
            )}

            {modalMode === 'delete' && (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                    <AlertTriangle size={18} className="text-red-500" />
                  </div>
                  <div>
                    <h3 className="text-slate-900 dark:text-white font-semibold">Delete User</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">@{selectedUser.username}</p>
                  </div>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-xl p-3">
                  <p className="text-red-700 dark:text-red-400 text-xs leading-relaxed">
                    This will permanently delete this user's profile and all associated data including listings, trades, and reviews. This action cannot be undone.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={closeModal} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={actionLoading}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-medium transition-all"
                  >
                    <Trash2 size={14} />
                    {actionLoading ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </>
            )}

            {modalMode === 'promote' && (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                    <Shield size={18} className="text-amber-500" />
                  </div>
                  <div>
                    <h3 className="text-slate-900 dark:text-white font-semibold">Change Role</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">@{selectedUser.username} · current: <span className="capitalize">{ROLE_LABELS[selectedUser.role]}</span></p>
                  </div>
                </div>
                <div className="space-y-2">
                  {(['hobbyist', 'vendor', 'farm', 'moderator'] as UserRole[]).map(role => (
                    <button
                      key={role}
                      onClick={() => setPromoteRole(role)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm transition-all ${
                        promoteRole === role
                          ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <span className="font-medium">{ROLE_LABELS[role]}</span>
                      {promoteRole === role && <CheckCircle size={16} className="text-amber-500" />}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={closeModal} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                    Cancel
                  </button>
                  <button
                    onClick={handlePromote}
                    disabled={actionLoading || promoteRole === selectedUser.role}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-sm font-medium transition-all"
                  >
                    <UserCheck size={14} />
                    {actionLoading ? 'Saving...' : 'Set Role'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-sm font-medium text-white transition-all animate-fade-in ${
          toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
        }`}>
          {toast.type === 'success' ? <CheckCircle size={15} /> : <AlertTriangle size={15} />}
          {toast.message}
        </div>
      )}
    </div>
  );

  async function handleUnbanDirect(u: ManagedUser) {
    const { error } = await supabase
      .from('profiles')
      .update({ is_banned: false, ban_reason: null, banned_at: null, banned_by: null })
      .eq('id', u.id);
    if (error) {
      showToast('Failed to unban user', 'error');
    } else {
      showToast(`@${u.username} has been unbanned`, 'success');
      loadUsers();
    }
  }
}
