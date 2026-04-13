import { useState } from 'react';
import { supabase, UserRole } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Waves, User, Store, Sprout } from 'lucide-react';

interface ProfileSetupProps {
  onComplete: () => void;
}

const roles: { value: UserRole; label: string; desc: string; Icon: typeof User }[] = [
  { value: 'hobbyist', label: 'Hobbyist', desc: 'I keep reef tanks for the love of it', Icon: User },
  { value: 'vendor', label: 'Vendor', desc: 'I sell corals independently', Icon: Store },
  { value: 'farm', label: 'Coral Farm', desc: 'I operate an aquaculture facility', Icon: Sprout },
];

export default function ProfileSetup({ onComplete }: ProfileSetupProps) {
  const { user, refreshProfile } = useAuth();
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState(user?.user_metadata?.full_name ?? '');
  const [role, setRole] = useState<UserRole>('hobbyist');
  const [locationCity, setLocationCity] = useState('');
  const [locationState, setLocationState] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError('');
    setLoading(true);

    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      username: username.toLowerCase().trim(),
      display_name: displayName.trim() || username.trim(),
      role,
      location_city: locationCity.trim() || null,
      location_state: locationState.trim() || null,
    }, { onConflict: 'id' });

    if (error) {
      if (error.code === '23505') setError('Username already taken. Try another.');
      else setError(error.message);
      setLoading(false);
      return;
    }

    await refreshProfile();
    setLoading(false);
    onComplete();
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors duration-200">
      <div className="w-full max-w-lg">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center">
            <Waves size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Set Up Your Profile</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Join the reef community</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 space-y-4 transition-colors duration-200">
            <h3 className="text-slate-900 dark:text-white font-semibold">Basic Info</h3>
            <div>
              <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1.5">Username <span className="text-red-400">*</span></label>
              <input
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                pattern="[a-zA-Z0-9_]+"
                title="Letters, numbers, underscores only"
                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                placeholder="reef_wizard_99"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1.5">Display Name</label>
              <input
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                placeholder="Jake's Reef"
              />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 space-y-3 transition-colors duration-200">
            <h3 className="text-slate-900 dark:text-white font-semibold">I am a...</h3>
            {roles.map(({ value, label, desc, Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setRole(value)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 text-left ${
                  role === value
                    ? 'bg-cyan-900/30 border-cyan-500 text-slate-900 dark:text-white'
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-500'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  role === value ? 'bg-cyan-500/20' : 'bg-slate-200 dark:bg-slate-700'
                }`}>
                  <Icon size={18} className={role === value ? 'text-cyan-400' : 'text-slate-500 dark:text-slate-400'} />
                </div>
                <div>
                  <div className="font-medium">{label}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{desc}</div>
                </div>
              </button>
            ))}
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 space-y-4 transition-colors duration-200">
            <h3 className="text-slate-900 dark:text-white font-semibold">Location <span className="text-slate-400 dark:text-slate-500 font-normal text-sm">(optional)</span></h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1.5">City</label>
                <input
                  value={locationCity}
                  onChange={e => setLocationCity(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                  placeholder="Miami"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1.5">State</label>
                <input
                  value={locationState}
                  onChange={e => setLocationState(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                  placeholder="FL"
                  maxLength={2}
                />
              </div>
            </div>
          </div>

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading || !username}
            className="w-full bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-400 hover:to-teal-500 text-white font-semibold py-4 rounded-xl transition-all duration-200 disabled:opacity-50 text-lg"
          >
            {loading ? 'Creating Profile...' : 'Enter the Reef'}
          </button>
        </form>
      </div>
    </div>
  );
}
