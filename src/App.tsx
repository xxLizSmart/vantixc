import { useState, lazy, Suspense } from 'react';
import { useAuth } from './contexts/AuthContext';
import Navigation from './components/Navigation';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const TradingPage = lazy(() => import('./pages/TradingPage'));
const KYCPage = lazy(() => import('./pages/KYCPage'));
const DepositPage = lazy(() => import('./pages/DepositPage'));
const WithdrawPage = lazy(() => import('./pages/WithdrawPage'));
const SwapPage = lazy(() => import('./pages/SwapPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));

function App() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('home');

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
  };

  const LoadingSpinner = () => (
    <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-white text-xl">Loading...</div>
      </div>
    </div>
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      {(user || currentPage === 'home' || currentPage === 'login') && (
        <Navigation currentPage={currentPage} onNavigate={handleNavigate} />
      )}

      <Suspense fallback={<LoadingSpinner />}>
        {currentPage === 'home' && <LandingPage onNavigate={handleNavigate} />}
        {currentPage === 'login' && <AuthPage onNavigate={handleNavigate} />}

        {user && (
          <>
            {currentPage === 'dashboard' && <Dashboard onNavigate={handleNavigate} />}
            {currentPage === 'trading' && <TradingPage onNavigate={handleNavigate} />}
            {currentPage === 'kyc' && <KYCPage />}
            {currentPage === 'deposit' && <DepositPage />}
            {currentPage === 'withdraw' && <WithdrawPage />}
            {currentPage === 'swap' && <SwapPage />}
            {currentPage === 'profile' && <ProfilePage />}
            {currentPage === 'admin' && <AdminPanel />}
          </>
        )}
      </Suspense>
    </div>
  );
}

export default App;
