import { ShoppingBag, TrendingUp, ArrowLeftRight, User, Menu, X, Bell, LogOut, Store } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

type Page = 'marketplace' | 'price-tracker' | 'trades' | 'profile' | 'admin' | 'vendors' | 'vendor-prices';

interface NavigationProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onAuthClick: () => void;
}

const navItems: { page: Page; label: string; Icon: typeof ShoppingBag }[] = [
  { page: 'vendor-prices', label: 'Vendor Prices', Icon: Store },
  { page: 'marketplace', label: 'Market', Icon: ShoppingBag },
  { page: 'price-tracker', label: 'Prices', Icon: TrendingUp },
  { page: 'trades', label: 'Trades', Icon: ArrowLeftRight },
  { page: 'profile', label: 'Profile', Icon: User },
];

export default function Navigation({ currentPage, onNavigate, onAuthClick }: NavigationProps) {
  const { user, profile, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      {/* Top bar */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-screen-xl mx-auto px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => onNavigate('vendor-prices')}
            className="flex items-center gap-2 group"
          >
            <span className="font-bold text-white text-lg tracking-tight">
              Frag<span className="text-cyan-400">X</span>
            </span>
          </button>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(({ page, label, Icon }) => (
              <button
                key={page}
                onClick={() => onNavigate(page)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  currentPage === page
                    ? 'bg-cyan-500/10 text-cyan-400'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {user ? (
              <>
                <button className="p-2 text-slate-400 hover:text-white transition-colors">
                  <Bell size={18} />
                </button>
                <button
                  onClick={() => onNavigate('profile')}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center text-xs font-bold text-white">
                    {profile?.username?.[0]?.toUpperCase() ?? 'U'}
                  </div>
                  <span className="text-sm text-slate-300 hidden sm:block">{profile?.username ?? 'Profile'}</span>
                </button>
                <button
                  onClick={signOut}
                  className="p-2 text-slate-400 hover:text-red-400 transition-colors hidden md:block"
                  title="Sign out"
                >
                  <LogOut size={16} />
                </button>
              </>
            ) : (
              <button
                onClick={onAuthClick}
                className="bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-400 hover:to-teal-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all duration-200"
              >
                Sign In
              </button>
            )}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 text-slate-400 hover:text-white transition-colors"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden bg-slate-950 border-t border-slate-800 px-4 py-3">
            {navItems.map(({ page, label, Icon }) => (
              <button
                key={page}
                onClick={() => { onNavigate(page); setMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  currentPage === page
                    ? 'bg-cyan-500/10 text-cyan-400'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Icon size={18} />
                {label}
              </button>
            ))}
            {user && (
              <button
                onClick={signOut}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-red-400 hover:text-red-300 transition-colors mt-1"
              >
                <LogOut size={18} />
                Sign Out
              </button>
            )}
          </div>
        )}
      </header>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map(({ page, label, Icon }) => (
            <button
              key={page}
              onClick={() => onNavigate(page)}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 ${
                currentPage === page ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Icon size={20} />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </>
  );
}
