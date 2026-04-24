import { useEffect, useState } from 'react';
import { Bell, BellOff, Mail, MessageSquare, TrendingDown, TrendingUp, X, Trash2, Check } from 'lucide-react';
import { supabase, ProductWatch } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

export interface WatchableProduct {
  vendor_slug: string;
  shopify_id: number;
  title: string;
  handle: string;
}

interface WatchModalProps {
  product: WatchableProduct;
  vendorName: string;
  onClose: () => void;
  onChanged: () => void;
}

interface WatchForm {
  notify_sold_out: boolean;
  notify_price_drop: boolean;
  notify_price_increase: boolean;
  notify_via_email: boolean;
  notify_via_sms: boolean;
}

const DEFAULT_FORM: WatchForm = {
  notify_sold_out: true,
  notify_price_drop: true,
  notify_price_increase: false,
  notify_via_email: true,
  notify_via_sms: false,
};

export default function WatchModal({ product, vendorName, onClose, onChanged }: WatchModalProps) {
  const { user, profile } = useAuth();
  const [existing, setExisting] = useState<ProductWatch | null>(null);
  const [form, setForm] = useState<WatchForm>(DEFAULT_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [saved, setSaved] = useState(false);

  const hasPhone = !!(profile as any)?.phone_number;
  const nothingSelected = !form.notify_sold_out && !form.notify_price_drop && !form.notify_price_increase;

  useEffect(() => {
    if (!user) return;
    loadWatch();
  }, [user]);

  async function loadWatch() {
    setLoading(true);
    const { data } = await supabase
      .from('product_watches')
      .select('*')
      .eq('user_id', user!.id)
      .eq('vendor_slug', product.vendor_slug)
      .eq('shopify_id', product.shopify_id)
      .maybeSingle();
    if (data) {
      setExisting(data);
      setForm({
        notify_sold_out: data.notify_sold_out,
        notify_price_drop: data.notify_price_drop,
        notify_price_increase: data.notify_price_increase,
        notify_via_email: data.notify_via_email,
        notify_via_sms: data.notify_via_sms,
      });
    }
    setLoading(false);
  }

  async function handleSave() {
    if (!user || nothingSelected) return;
    setSaving(true);
    const payload = {
      user_id: user.id,
      vendor_slug: product.vendor_slug,
      shopify_id: product.shopify_id,
      product_title: product.title,
      product_handle: product.handle,
      ...form,
    };
    if (existing) {
      await supabase.from('product_watches').update(form).eq('id', existing.id);
    } else {
      await supabase.from('product_watches').insert(payload);
    }
    setSaving(false);
    setSaved(true);
    onChanged();
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 900);
  }

  async function handleRemove() {
    if (!existing) return;
    setRemoving(true);
    await supabase.from('product_watches').delete().eq('id', existing.id);
    setRemoving(false);
    onChanged();
    onClose();
  }

  function toggle(key: keyof WatchForm) {
    setForm(f => ({ ...f, [key]: !f[key] }));
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-slate-200 dark:border-slate-700/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <Bell size={16} className="text-cyan-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white leading-tight">Watch product</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{vendorName}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 -mr-1 rounded-lg">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Product name */}
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 line-clamp-2">{product.title}</p>

          {loading ? (
            <div className="flex items-center justify-center py-6">
              <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Notify when */}
              <div>
                <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Notify me when</p>
                <div className="space-y-2">
                  <ToggleRow
                    icon={<BellOff size={14} className="text-slate-400" />}
                    label="Sold out or unlisted"
                    checked={form.notify_sold_out}
                    onChange={() => toggle('notify_sold_out')}
                  />
                  <ToggleRow
                    icon={<TrendingDown size={14} className="text-emerald-400" />}
                    label="Price drops"
                    checked={form.notify_price_drop}
                    onChange={() => toggle('notify_price_drop')}
                  />
                  <ToggleRow
                    icon={<TrendingUp size={14} className="text-red-400" />}
                    label="Price increases"
                    checked={form.notify_price_increase}
                    onChange={() => toggle('notify_price_increase')}
                  />
                </div>
              </div>

              {/* Notify via */}
              <div>
                <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Notify via</p>
                <div className="space-y-2">
                  <ToggleRow
                    icon={<Mail size={14} className="text-cyan-400" />}
                    label="Email"
                    checked={form.notify_via_email}
                    onChange={() => toggle('notify_via_email')}
                  />
                  <div>
                    <ToggleRow
                      icon={<MessageSquare size={14} className="text-teal-400" />}
                      label="Text message (SMS)"
                      checked={form.notify_via_sms}
                      onChange={() => toggle('notify_via_sms')}
                    />
                    {form.notify_via_sms && !hasPhone && (
                      <p className="text-[10px] text-amber-400 mt-1.5 pl-7">
                        Add a phone number in your profile to receive SMS alerts.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {nothingSelected && (
                <p className="text-[11px] text-amber-400">Select at least one notification type.</p>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!loading && (
          <div className="px-5 pb-5 flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={saving || saved || nothingSelected}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                saved
                  ? 'bg-emerald-500 text-white'
                  : nothingSelected
                  ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-white'
              }`}
            >
              {saved ? <><Check size={14} /> Saved</> : saving ? 'Saving...' : existing ? 'Update watch' : 'Watch product'}
            </button>
            {existing && (
              <button
                onClick={handleRemove}
                disabled={removing}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-red-400 hover:border-red-400/50 transition-all"
                title="Remove watch"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ToggleRow({ icon, label, checked, onChange }: {
  icon: React.ReactNode;
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border text-left transition-all ${
        checked
          ? 'bg-cyan-500/10 border-cyan-500/30 text-slate-900 dark:text-white'
          : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
      }`}
    >
      <span className="flex-shrink-0">{icon}</span>
      <span className="text-xs font-medium flex-1">{label}</span>
      <span className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border transition-all ${
        checked ? 'bg-cyan-500 border-cyan-500' : 'border-slate-300 dark:border-slate-600'
      }`}>
        {checked && <Check size={10} className="text-white" />}
      </span>
    </button>
  );
}
