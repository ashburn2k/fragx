import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Search, RefreshCw, Pencil, Trash2, X, CheckCircle, AlertTriangle, ArrowLeftRight
} from 'lucide-react';

const CORAL_TYPES = ['SPS', 'LPS', 'Soft Coral', 'Equipment', 'Tank', 'Light', 'Other'];

type ListType = 'have' | 'want';

interface TradeEntry {
  id: string;
  user_id: string;
  coral_type: string | null;
  notes: string | null;
  quantity?: number | null;
  asking_price?: number | null;
  max_price?: number | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  owner?: { username: string; display_name: string | null };
}

interface EditState {
  id: string;
  listType: ListType;
  coral_type: string;
  notes: string;
  quantity: string;
  asking_price: string;
  max_price: string;
}

export default function TradeModPanel() {
  const [listType, setListType] = useState<ListType>('have');
  const [entries, setEntries] = useState<TradeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editState, setEditState] = useState<EditState | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadEntries();
  }, [listType]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  async function loadEntries() {
    setLoading(true);
    const table = listType === 'have' ? 'have_list' : 'want_list';
    const { data } = await supabase
      .from(table)
      .select('*, owner:user_id(username, display_name)')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(100);
    setEntries((data ?? []) as TradeEntry[]);
    setLoading(false);
  }

  function startEdit(entry: TradeEntry) {
    setEditState({
      id: entry.id,
      listType,
      coral_type: entry.coral_type ?? '',
      notes: entry.notes ?? '',
      quantity: String(entry.quantity ?? 1),
      asking_price: entry.asking_price != null ? String(entry.asking_price) : '',
      max_price: entry.max_price != null ? String(entry.max_price) : '',
    });
  }

  async function saveEdit() {
    if (!editState) return;
    setSaving(true);
    const table = editState.listType === 'have' ? 'have_list' : 'want_list';
    const patch: Record<string, unknown> = {
      coral_type: editState.coral_type || null,
      notes: editState.notes || null,
    };
    if (editState.listType === 'have') {
      patch.quantity = parseInt(editState.quantity) || 1;
      patch.asking_price = editState.asking_price ? parseFloat(editState.asking_price) : null;
    } else {
      patch.max_price = editState.max_price ? parseFloat(editState.max_price) : null;
    }
    const { error } = await supabase.from(table).update(patch).eq('id', editState.id);
    setSaving(false);
    if (error) {
      showToast('Failed to save changes', 'error');
    } else {
      showToast('Entry updated', 'success');
      setEditState(null);
      loadEntries();
    }
  }

  async function removeEntry(entry: TradeEntry) {
    const table = listType === 'have' ? 'have_list' : 'want_list';
    const { error } = await supabase.from(table).update({ is_active: false }).eq('id', entry.id);
    if (error) {
      showToast('Failed to remove entry', 'error');
    } else {
      showToast('Entry removed', 'success');
      loadEntries();
    }
  }

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ message, type });
  }

  const filtered = entries.filter(e => {
    const owner = e.owner as { username: string; display_name: string | null } | undefined;
    const q = search.toLowerCase();
    return (
      (e.coral_type ?? '').toLowerCase().includes(q) ||
      (e.notes ?? '').toLowerCase().includes(q) ||
      (owner?.username ?? '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by coral type, notes, or user..."
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all"
          />
        </div>
        <div className="flex gap-2">
          {(['have', 'want'] as ListType[]).map(t => (
            <button
              key={t}
              onClick={() => { setListType(t); setEditState(null); }}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition-all capitalize ${
                listType === t
                  ? 'bg-red-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t} List
            </button>
          ))}
          <button
            onClick={loadEntries}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"
            title="Refresh"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      <p className="text-slate-400 dark:text-slate-500 text-xs">{filtered.length} active {listType === 'have' ? 'have' : 'want'} entries</p>

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
          <ArrowLeftRight size={28} className="text-slate-400 dark:text-slate-600 mx-auto mb-2" />
          <p className="text-slate-400 dark:text-slate-500 text-sm">No entries found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(entry => {
            const owner = entry.owner as { username: string; display_name: string | null } | undefined;
            const isEditing = editState?.id === entry.id;

            if (isEditing && editState) {
              return (
                <div key={entry.id} className="bg-white dark:bg-slate-900 border border-cyan-300 dark:border-cyan-700 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400 text-xs">Editing @{owner?.username}'s entry</span>
                    <button onClick={() => setEditState(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                      <X size={14} />
                    </button>
                  </div>
                  <select
                    value={editState.coral_type}
                    onChange={e => setEditState(s => s ? { ...s, coral_type: e.target.value } : s)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="">Select coral type...</option>
                    {CORAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <input
                    value={editState.notes}
                    onChange={e => setEditState(s => s ? { ...s, notes: e.target.value } : s)}
                    placeholder="Notes..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
                  />
                  {listType === 'have' ? (
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        value={editState.quantity}
                        onChange={e => setEditState(s => s ? { ...s, quantity: e.target.value } : s)}
                        type="number" min="1" placeholder="Quantity"
                        className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                      />
                      <input
                        value={editState.asking_price}
                        onChange={e => setEditState(s => s ? { ...s, asking_price: e.target.value } : s)}
                        type="number" min="0" placeholder="Asking price ($)"
                        className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  ) : (
                    <input
                      value={editState.max_price}
                      onChange={e => setEditState(s => s ? { ...s, max_price: e.target.value } : s)}
                      type="number" min="0" placeholder="Max price ($)"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                    />
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditState(null)}
                      className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveEdit}
                      disabled={saving}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-white text-sm font-medium transition-all"
                    >
                      <CheckCircle size={13} />
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div key={entry.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 flex items-center gap-3 transition-colors duration-200">
                {entry.image_url && (
                  <img src={entry.image_url} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-slate-200 dark:border-slate-700" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-slate-900 dark:text-white text-sm font-medium">{entry.coral_type ?? 'Unknown'}</span>
                    <span className="text-slate-400 dark:text-slate-500 text-xs">by @{owner?.username}</span>
                  </div>
                  <div className="text-slate-400 dark:text-slate-500 text-xs mt-0.5">
                    {listType === 'have'
                      ? `Qty: ${entry.quantity ?? 1}${entry.asking_price ? ` · $${entry.asking_price}` : ''}`
                      : `${entry.max_price ? `Max: $${entry.max_price}` : 'No max price'}`
                    }
                    {entry.notes ? ` · ${entry.notes}` : ''}
                  </div>
                  <div className="text-slate-300 dark:text-slate-600 text-xs mt-0.5">{new Date(entry.created_at).toLocaleDateString()}</div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => startEdit(entry)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-500 hover:bg-cyan-500/10 transition-all"
                    title="Edit entry"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => removeEntry(entry)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-all"
                    title="Remove entry"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-sm font-medium text-white ${
          toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
        }`}>
          {toast.type === 'success' ? <CheckCircle size={15} /> : <AlertTriangle size={15} />}
          {toast.message}
        </div>
      )}
    </div>
  );
}
