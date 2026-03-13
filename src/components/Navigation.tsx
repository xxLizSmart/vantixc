import { useState, lazy, Suspense } from 'react';
import {
  Menu, X, Globe, LogOut, User, Shield,
  Home, Lock, FileText, HelpCircle,
  LayoutDashboard, TrendingUp, BadgeCheck, ArrowDownCircle, ArrowUpCircle, ArrowLeftRight,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import PriceTicker from './PriceTicker';

const LocaleModal = lazy(() => import('./LocaleModal'));

interface NavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const PUBLIC_NAV = [
  { id: 'home',    label: 'Home',    Icon: Home       },
  { id: 'privacy', label: 'Privacy', Icon: Lock       },
  { id: 'terms',   label: 'Terms',   Icon: FileText   },
  { id: 'faq',     label: 'FAQ',     Icon: HelpCircle },
];

const AUTH_BOTTOM_NAV = [
  { id: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard, featured: false },
  { id: 'trading',   label: 'Trade',     Icon: TrendingUp,      featured: false },
  { id: 'deposit',   label: 'Deposit',   Icon: ArrowDownCircle, featured: true  },
  { id: 'kyc',       label: 'KYC',       Icon: BadgeCheck,      featured: false },
  { id: 'swap',      label: 'Swapper',   Icon: ArrowLeftRight,  featured: false },
];

function Navigation({ currentPage, onNavigate }: NavigationProps) {
  const { user, profile, signOut } = useAuth();
  const { t, locale } = useLanguage();
  const { currency } = useCurrency();
  const [mobileMenuOpen, setMobileMenuOpen]   = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [localeModalOpen, setLocaleModalOpen] = useState(false);

  const handleSignOut = async () => {
    setProfileDropdownOpen(false);
    setMobileMenuOpen(false);
    try { await signOut(); } catch { /* ignore */ }
  };

  const isAdmin = Boolean(profile?.is_admin);
  const bottomNavItems = user ? AUTH_BOTTOM_NAV : PUBLIC_NAV;

  // ── Bottom nav pill button ─────────────────────────────────────────────────
  const BottomNavItem = ({
    id, label, Icon, featured = false,
  }: { id: string; label: string; Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; featured?: boolean }) => {
    const active = currentPage === id;
    if (featured) {
      return (
        <button
          onClick={() => { onNavigate(id); setMobileMenuOpen(false); }}
          className="flex flex-col items-center justify-center gap-1 -mt-5 transition-all duration-200 relative"
          style={{ minWidth: '4rem' }}
        >
          <span
            className="flex items-center justify-center w-12 h-12 rounded-full transition-all duration-200"
            style={{
              background: active
                ? 'linear-gradient(135deg, #00EBFF 0%, #00b8cc 100%)'
                : 'linear-gradient(135deg, rgba(0,235,255,0.85) 0%, rgba(0,160,180,0.9) 100%)',
              boxShadow: active
                ? '0 0 0 3px rgba(0,235,255,0.25), 0 0 20px rgba(0,235,255,0.55), 0 4px 12px rgba(0,0,0,0.5)'
                : '0 0 0 2px rgba(0,235,255,0.18), 0 0 12px rgba(0,235,255,0.35), 0 4px 12px rgba(0,0,0,0.4)',
            }}
          >
            <Icon className="w-6 h-6" style={{ color: '#080808' }} />
          </span>
          <span className="text-[10px] font-semibold leading-none tracking-wide whitespace-nowrap"
            style={{ color: '#00EBFF', textShadow: '0 0 8px rgba(0,235,255,0.5)' }}>
            {label}
          </span>
        </button>
      );
    }
    return (
      <button
        onClick={() => { onNavigate(id); setMobileMenuOpen(false); }}
        className="flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 relative"
        style={{
          minWidth: '3.5rem',
          background: active ? 'rgba(0,235,255,0.10)' : 'transparent',
          border: active ? '1px solid rgba(0,235,255,0.28)' : '1px solid transparent',
        }}
      >
        {active && (
          <span className="absolute -top-px left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full"
            style={{ background: '#00EBFF', boxShadow: '0 0 8px rgba(0,235,255,0.8)' }} />
        )}
        <Icon className="w-5 h-5 transition-all duration-200"
          style={{ color: active ? '#00EBFF' : '#5A6677', filter: active ? 'drop-shadow(0 0 6px rgba(0,235,255,0.65))' : 'none' }} />
        <span className="text-[10px] font-medium leading-none tracking-wide transition-colors duration-200 whitespace-nowrap"
          style={{ color: active ? '#00EBFF' : '#5A6677' }}>
          {label}
        </span>
      </button>
    );
  };

  return (
    <>
      <PriceTicker />

      {/* ── Top header ──────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-40"
        style={{ background: 'rgba(8,8,8,0.92)', borderBottom: '1px solid rgba(0,235,255,0.12)', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">

            {/* Logo */}
            <button onClick={() => onNavigate('home')} className="flex items-center gap-2">
              <img src="https://i.imgur.com/oJYd0t6.png" alt="Vantix" className="h-11 w-auto object-contain"
                style={{ filter: 'drop-shadow(0 0 8px rgba(0,235,255,0.55))' }} />
            </button>

            {/* Right controls — desktop */}
            <div className="hidden md:flex items-center space-x-1">

              {/* Globe / Locale selector */}
              <button
                onClick={() => setLocaleModalOpen(true)}
                title="Language & Currency"
                className="flex items-center gap-1.5 px-2.5 py-2 rounded-md transition-colors"
                style={{ color: '#7A8899' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#00EBFF')}
                onMouseLeave={e => (e.currentTarget.style.color = '#7A8899')}
              >
                <Globe className="w-4 h-4" />
                <span className="text-xs font-medium">{locale.flag}</span>
                <span className="text-xs" style={{ color: '#5A6677' }}>{currency.code}</span>
              </button>

              {/* User / Login */}
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => { setProfileDropdownOpen(!profileDropdownOpen); }}
                    className="flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors"
                    style={{ color: '#C0B8B8' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#F5F5F0')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#C0B8B8')}
                  >
                    {profile?.avatar_url
                      ? <img src={profile.avatar_url} alt="Avatar" className="w-6 h-6 rounded-full" />
                      : <User className="w-4 h-4" />
                    }
                    <span className="max-w-[100px] truncate text-xs">{profile?.username || user.email}</span>
                  </button>
                  {profileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 rounded-lg shadow-2xl z-50"
                      style={{ background: '#1a1212', border: '1px solid rgba(0,235,255,0.2)' }}>
                      <button onClick={() => { onNavigate('profile'); setProfileDropdownOpen(false); }}
                        className="block w-full text-left px-4 py-2.5 text-sm transition-colors"
                        style={{ color: '#C0B8B8' }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#00EBFF'; e.currentTarget.style.background = 'rgba(0,235,255,0.05)'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = '#C0B8B8'; e.currentTarget.style.background = 'transparent'; }}
                      >Profile Settings</button>
                      {isAdmin && (
                        <button onClick={() => { onNavigate('admin'); setProfileDropdownOpen(false); }}
                          className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm transition-colors"
                          style={{ color: '#00EBFF', borderTop: '1px solid rgba(0,235,255,0.12)' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,235,255,0.05)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        ><Shield className="w-4 h-4" /><span>Admin Panel</span></button>
                      )}
                      <button onClick={handleSignOut}
                        className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm transition-colors"
                        style={{ color: '#C0B8B8', borderTop: '1px solid rgba(0,235,255,0.12)' }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.06)'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = '#C0B8B8'; e.currentTarget.style.background = 'transparent'; }}
                      ><LogOut className="w-4 h-4" /><span>{t('logout')}</span></button>
                    </div>
                  )}
                </div>
              ) : (
                <button onClick={() => onNavigate('login')}
                  className="ml-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all"
                  style={{ background: '#00EBFF', color: '#080808', boxShadow: '0 0 16px rgba(0,235,255,0.3)' }}
                  onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 0 28px rgba(0,235,255,0.3)')}
                  onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 0 16px rgba(0,235,255,0.3)')}
                >{t('login')}</button>
              )}
            </div>

            {/* Mobile right: globe + hamburger */}
            <div className="md:hidden flex items-center gap-1">
              <button
                onClick={() => setLocaleModalOpen(true)}
                className="flex items-center justify-center w-10 h-10 rounded-lg"
                style={{ color: '#7A8899' }}
              >
                <span className="text-lg">{locale.flag}</span>
              </button>
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="flex items-center justify-center w-11 h-11"
                style={{ color: '#00EBFF' }}>
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden" style={{ background: '#0d0a0a', borderTop: '1px solid rgba(0,235,255,0.12)' }}>
            <div className="px-4 pt-3 pb-4 space-y-1">
              {/* Language/Currency row */}
              <button
                onClick={() => { setLocaleModalOpen(true); setMobileMenuOpen(false); }}
                className="flex items-center gap-3 w-full text-left px-3 py-3 rounded-lg text-sm transition-colors"
                style={{ color: '#C0B8B8' }}
              >
                <Globe className="w-4 h-4" style={{ color: '#00EBFF' }} />
                <span>{locale.flag} {locale.name}</span>
                <span className="ml-auto text-xs" style={{ color: '#5A6677' }}>{currency.code}</span>
              </button>
              <div style={{ height: '1px', background: 'rgba(0,235,255,0.12)', margin: '4px 0' }} />
              {user && (
                <>
                  <button onClick={() => { onNavigate('withdraw'); setMobileMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-3 rounded-lg text-sm transition-colors"
                    style={currentPage === 'withdraw'
                      ? { background: 'rgba(0,235,255,0.1)', color: '#00EBFF' }
                      : { color: '#C0B8B8' }}
                  ><ArrowUpCircle className="w-4 h-4" /> Withdraw</button>
                  {isAdmin && (
                    <button onClick={() => { onNavigate('admin'); setMobileMenuOpen(false); }}
                      className="flex items-center gap-2 w-full text-left px-3 py-3 rounded-lg text-sm"
                      style={{ color: '#00EBFF' }}
                    ><Shield className="w-4 h-4" /> Admin Panel</button>
                  )}
                  <div style={{ height: '1px', background: 'rgba(0,235,255,0.12)', margin: '4px 0' }} />
                  <button onClick={() => { onNavigate('profile'); setMobileMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-3 rounded-lg text-sm transition-colors"
                    style={{ color: '#C0B8B8' }}
                  ><User className="w-4 h-4" /> Profile Settings</button>
                  <button onClick={handleSignOut}
                    className="flex items-center gap-2 w-full text-left px-3 py-3 rounded-lg text-sm"
                    style={{ color: '#EF4444' }}
                  ><LogOut className="w-4 h-4" /> {t('logout')}</button>
                </>
              )}
              {!user && (
                <button onClick={() => { onNavigate('login'); setMobileMenuOpen(false); }}
                  className="block w-full text-left px-3 py-3 rounded-lg text-sm font-semibold"
                  style={{ background: '#00EBFF', color: '#080808' }}
                >{t('login')}</button>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* ── Fixed bottom glassmorphism nav ────────────────────────────────────── */}
      <div
        className="fixed bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-2 rounded-2xl"
        style={{
          zIndex: 40,
          background: 'rgba(18,14,14,0.82)',
          border: '1px solid rgba(0,235,255,0.2)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.55), 0 0 0 1px rgba(0,235,255,0.06), inset 0 1px 0 rgba(255,255,255,0.04)',
        }}
      >
        {bottomNavItems.map((item) => (
          <BottomNavItem
            key={item.id}
            id={item.id}
            label={item.label}
            Icon={item.Icon}
            featured={'featured' in item ? (item as any).featured : false}
          />
        ))}
      </div>

      <div className="h-24" aria-hidden="true" />

      {/* ── Locale modal ─────────────────────────────────────────────────────── */}
      {localeModalOpen && (
        <Suspense fallback={null}>
          <LocaleModal onClose={() => setLocaleModalOpen(false)} />
        </Suspense>
      )}
    </>
  );
}

// No memo — Navigation must re-render when profile (is_admin, balances) updates
export default Navigation;
