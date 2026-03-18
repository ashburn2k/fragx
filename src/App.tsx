import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navigation from './components/layout/Navigation';
import AuthModal from './components/auth/AuthModal';
import ProfileSetup from './components/auth/ProfileSetup';
import ReefToolsPage from './pages/ReefToolsPage';
import PriceTrackerPage from './pages/PriceTrackerPage';
import VendorsPage from './pages/VendorsPage';
import VendorPricesPage from './pages/VendorPricesPage';
import TradesPage from './pages/TradesPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
type Page = 'reef-tools' | 'price-tracker' | 'trades' | 'profile' | 'admin' | 'vendors' | 'vendor-prices';

function AppInner() {
  const { user, profile, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('vendor-prices');
  const [showAuth, setShowAuth] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 animate-pulse" />
          <div className="text-slate-400 text-sm">Loading...</div>
        </div>
      </div>
    );
  }

  if (user && !profile) {
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
    <div className="min-h-screen bg-slate-950 text-white">
      <Navigation
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onAuthClick={() => setShowAuth(true)}
      />

      <main className="max-w-screen-xl mx-auto px-4 pt-20 pb-24 md:pb-8">
        {currentPage === 'reef-tools' && <ReefToolsPage />}
        {currentPage === 'price-tracker' && <PriceTrackerPage />}
        {currentPage === 'vendors' && <VendorsPage onViewPrices={(page) => handleNavigate(page as Page)} />}
        {currentPage === 'vendor-prices' && <VendorPricesPage />}
        {currentPage === 'trades' && <TradesPage />}
        {currentPage === 'profile' && <ProfilePage onListingClick={() => {}} />}
        {currentPage === 'admin' && user && <AdminPage />}
      </main>

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
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
