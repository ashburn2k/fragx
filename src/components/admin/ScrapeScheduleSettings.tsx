import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Clock, Save, CheckCircle, AlertTriangle } from 'lucide-react';

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

function parseCron(expr: string): { hour: number; minute: number } | null {
  const parts = expr.trim().split(/\s+/);
  if (parts.length < 2) return null;
  const minute = parseInt(parts[0], 10);
  const hour = parseInt(parts[1], 10);
  if (isNaN(hour) || isNaN(minute)) return null;
  return { hour, minute };
}

function formatTime(hour: number, minute: number): string {
  const h = hour % 12 || 12;
  const m = minute.toString().padStart(2, '0');
  const period = hour < 12 ? 'AM' : 'PM';
  return `${h}:${m} ${period} UTC`;
}

export default function ScrapeScheduleSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hour, setHour] = useState(2);
  const [minute, setMinute] = useState(0);
  const [savedHour, setSavedHour] = useState(2);
  const [savedMinute, setSavedMinute] = useState(0);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data } = await supabase
        .from('app_settings')
        .select('value, updated_at')
        .eq('key', 'scrape_schedule_cron')
        .maybeSingle();

      if (data?.value) {
        const parsed = parseCron(data.value);
        if (parsed) {
          setHour(parsed.hour);
          setMinute(parsed.minute);
          setSavedHour(parsed.hour);
          setSavedMinute(parsed.minute);
        }
        setUpdatedAt(data.updated_at ?? null);
      }
      setLoading(false);
    }
    load();
  }, []);

  const isDirty = hour !== savedHour || minute !== savedMinute;

  async function handleSave() {
    setSaving(true);
    setStatus('idle');
    setErrorMsg('');

    const { data, error } = await supabase.rpc('admin_update_scrape_schedule', {
      p_hour: hour,
      p_minute: minute,
    });

    if (error || !data?.success) {
      setStatus('error');
      setErrorMsg(error?.message ?? 'Failed to update schedule');
    } else {
      setSavedHour(hour);
      setSavedMinute(minute);
      setUpdatedAt(new Date().toISOString());
      setStatus('success');
      setTimeout(() => setStatus('idle'), 3000);
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 animate-pulse h-32" />
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
          <Clock size={18} className="text-blue-500" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h3 className="text-slate-900 dark:text-white font-semibold text-sm">Daily Scan Schedule</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 leading-relaxed">
                Sets the time the automated daily store scan runs via pg_cron. All times are in UTC.
                Currently scheduled for <span className="text-slate-700 dark:text-slate-200 font-medium">{formatTime(savedHour, savedMinute)}</span>.
              </p>
              {updatedAt && (
                <p className="text-slate-400 dark:text-slate-600 text-xs mt-1">
                  Last changed {new Date(updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              )}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <label className="text-xs text-slate-500 dark:text-slate-400 font-medium">Hour (UTC)</label>
              <select
                value={hour}
                onChange={e => setHour(Number(e.target.value))}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              >
                {HOURS.map(h => (
                  <option key={h} value={h}>
                    {h.toString().padStart(2, '0')}:00 — {formatTime(h, 0)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-500 dark:text-slate-400 font-medium">Minute</label>
              <select
                value={minute}
                onChange={e => setMinute(Number(e.target.value))}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              >
                {MINUTES.map(m => (
                  <option key={m} value={m}>
                    :{m.toString().padStart(2, '0')}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleSave}
              disabled={saving || !isDirty}
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-400 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-xl transition-all"
            >
              <Save size={14} />
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>

          {status === 'success' && (
            <div className="mt-3 flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
              <CheckCircle size={13} />
              Schedule updated to {formatTime(savedHour, savedMinute)} — cron job rescheduled.
            </div>
          )}
          {status === 'error' && (
            <div className="mt-3 flex items-center gap-2 text-xs text-red-500">
              <AlertTriangle size={13} />
              {errorMsg}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
