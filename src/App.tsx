import { useState, lazy, Suspense, useEffect, useRef } from 'react';
import { useAuth } from './contexts/AuthContext';
import Navigation from './components/Navigation';
import SupportChat from './components/SupportChat';

const LandingPage  = lazy(() => import('./pages/LandingPage'));
const AuthPage     = lazy(() => import('./pages/AuthPage'));
const Dashboard    = lazy(() => import('./pages/Dashboard'));
const TradingPage  = lazy(() => import('./pages/TradingPage'));
const KYCPage      = lazy(() => import('./pages/KYCPage'));
const DepositPage  = lazy(() => import('./pages/DepositPage'));
const WithdrawPage = lazy(() => import('./pages/WithdrawPage'));
const SwapPage     = lazy(() => import('./pages/SwapPage'));
const ProfilePage  = lazy(() => import('./pages/ProfilePage'));
const AdminPanel   = lazy(() => import('./pages/AdminPanel'));
const DownloadPage = lazy(() => import('./pages/DownloadPage'));
const PrivacyPage  = lazy(() => import('./pages/PrivacyPage'));
const TermsPage    = lazy(() => import('./pages/TermsPage'));
const FAQPage      = lazy(() => import('./pages/FAQPage'));

const PROTECTED = new Set(['dashboard','trading','kyc','deposit','withdraw','swap','profile','admin']);

function App() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('home');
  const prevUserRef = useRef<string | null>(null);   // tracks user.id across renders

  // ── React to auth state changes ──────────────────────────────────────────
  useEffect(() => {
    if (loading) return;

    const prevUserId = prevUserRef.current;
    const currUserId = user?.id ?? null;

    // User just logged IN (was null, now has id)
    if (!prevUserId && currUserId) {
      setCurrentPage('dashboard');
    }

    // User just logged OUT (had id, now null)
    if (prevUserId && !currUserId) {
      setCurrentPage('home');
    }

    prevUserRef.current = currUserId;
  }, [user, loading]);

  // ── Navigation handler ───────────────────────────────────────────────────
  const handleNavigate = (page: string) => {
    if (!user && PROTECTED.has(page)) {
      setCurrentPage('login');
      return;
    }
    setCurrentPage(page);
  };

  // ── Loading screen ───────────────────────────────────────────────────────
  const Spinner = () => (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#080808' }}>
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full animate-spin"
            style={{ border: '3px solid transparent', borderTopColor: '#00EBFF', borderRightColor: 'rgba(0,235,255,0.3)' }} />
          <div className="absolute inset-2 rounded-full animate-ping opacity-20"
            style={{ background: 'rgba(0,235,255,0.4)' }} />
        </div>
        <div className="text-sm font-medium" style={{ color: '#C0B8B8' }}>Loading…</div>
      </div>
    </div>
  );

  if (loading) return <Spinner />;

  const PUBLIC_PAGES = new Set(['home', 'login', 'download', 'privacy', 'terms', 'faq']);
  const showNav = !!user || PUBLIC_PAGES.has(currentPage);

  // If somehow on a protected page without auth, fall back to home render
  const safePage = (!user && PROTECTED.has(currentPage)) ? 'home' : currentPage;

  return (
    <div className="min-h-screen" style={{ background: '#080808' }}>
      {showNav && <Navigation currentPage={safePage} onNavigate={handleNavigate} />}

      <Suspense fallback={<Spinner />}>
        {safePage === 'home'     && <LandingPage  onNavigate={handleNavigate} />}
        {safePage === 'login'    && <AuthPage     onNavigate={handleNavigate} />}
        {safePage === 'download' && <DownloadPage onNavigate={handleNavigate} />}
        {safePage === 'privacy'  && <PrivacyPage />}
        {safePage === 'terms'    && <TermsPage />}
        {safePage === 'faq'      && <FAQPage />}

        {user && (
          <>
            {safePage === 'dashboard' && <Dashboard    onNavigate={handleNavigate} />}
            {safePage === 'trading'   && <TradingPage  onNavigate={handleNavigate} />}
            {safePage === 'kyc'       && <KYCPage />}
            {safePage === 'deposit'   && <DepositPage />}
            {safePage === 'withdraw'  && <WithdrawPage />}
            {safePage === 'swap'      && <SwapPage />}
            {safePage === 'profile'   && <ProfilePage />}
            {safePage === 'admin'     && <AdminPanel />}
          </>
        )}
      </Suspense>

      {/* Always-visible support chat bubble */}
      <SupportChat />
    </div>
  );
}

export default App;
