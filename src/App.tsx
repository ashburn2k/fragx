import { useState, lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navigation from './components/layout/Navigation';
import AuthModal from './components/auth/AuthModal';
import ProfileSetup from './components/auth/ProfileSetup';

const ReefToolsPage = lazy(() => import('./pages/ReefToolsPage'));
const PriceTrackerPage = lazy(() => import('./pages/PriceTrackerPage'));
const VendorsPage = lazy(() => import('./pages/VendorsPage'));
const VendorPricesPage = lazy(() => import('./pages/VendorPricesPage'));
const TradesPage = lazy(() => import('./pages/TradesPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));

type Page = 'reef-tools' | 'price-tracker' | 'trades' | 'profile' | 'admin' | 'vendors' | 'vendor-prices';

function PageLoader() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 animate-pulse" />
        <div className="text-slate-500 dark:text-slate-400 text-sm">Loading...</div>
      </div>
    </div>
  );
}

function AppInner() {
  const { user, profile, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('vendor-prices');
  const [showAuth, setShowAuth] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 animate-pulse" />
          <div className="text-slate-500 dark:text-slate-400 text-sm">Loading...</div>
        </div>
      </div>
    );
  }

  if (user && (!profile || !profile.username)) {
    return <ProfileSetup onComplete={() => {}} />;
  }

  function handleNavigate(page: Page) {
    if ((page === 'trades' || page === 'profile') && !user) {
      setShowAuth(true);
      return;
    }
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-200">
      <Navigation
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onAuthClick={() => setShowAuth(true)}
      />

      <main className="max-w-screen-xl mx-auto px-4 pt-20 pb-24 md:pb-8">
        <Suspense fallback={<PageLoader />}>
          {currentPage === 'reef-tools' && <ReefToolsPage />}
          {currentPage === 'price-tracker' && <PriceTrackerPage />}
          {currentPage === 'vendors' && <VendorsPage onViewPrices={(page) => handleNavigate(page as Page)} />}
          {currentPage === 'vendor-prices' && <VendorPricesPage />}
          {currentPage === 'trades' && <TradesPage />}
          {currentPage === 'profile' && <ProfilePage />}
          {currentPage === 'admin' && user && <AdminPage />}
        </Suspense>
      </main>

      <footer className="hidden md:block border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 transition-colors duration-200">
        <div className="max-w-screen-xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-slate-400 dark:text-slate-500 text-xs">
            &copy; {new Date().getFullYear()} BlueKrush. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs">
            <a
              href="https://bluekrush.fish"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 dark:text-slate-500 hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors"
            >
              bluekrush.fish
            </a>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <a
              href="mailto:sales@bluekrush.fish"
              className="text-slate-400 dark:text-slate-500 hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors"
            >
              sales@bluekrush.fish
            </a>
          </div>
        </div>
      </footer>

      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          onSuccess={() => setShowAuth(false)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppInner />
      </AuthProvider>
    </ThemeProvider>
  );
}
