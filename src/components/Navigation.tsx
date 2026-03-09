import { useState, memo } from 'react';
import { Menu, X, Globe, DollarSign, LogOut, User, Shield, Sun, Moon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage, languageOptions } from '../contexts/LanguageContext';
import { useCurrency, currencies } from '../contexts/CurrencyContext';
import { useTheme } from '../contexts/ThemeContext';
import PriceTicker from './PriceTicker';

interface NavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

function Navigation({ currentPage, onNavigate }: NavigationProps) {
  const { user, profile, signOut } = useAuth();
  const { t, setLanguage } = useLanguage();
  const { currency, setCurrency } = useCurrency();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [languageDropdownOpen, setLanguageDropdownOpen] = useState(false);
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    onNavigate('home');
  };

  const isAdmin = Boolean(profile?.is_admin);

  console.log('Navigation - isAdmin check:', {
    profile_is_admin: profile?.is_admin,
    isAdmin: isAdmin,
    profile_username: profile?.username,
    profile_object: profile
  });

  const navItems = user
    ? [
        { id: 'dashboard', label: t('dashboard') },
        { id: 'trading', label: t('trading') },
        { id: 'kyc', label: t('kyc') },
        { id: 'deposit', label: t('deposit') },
        { id: 'withdraw', label: t('withdraw') },
        { id: 'swap', label: t('swap') },
        ...(isAdmin ? [{ id: 'admin', label: t('admin'), isAdmin: true }] : []),
      ]
    : [{ id: 'home', label: t('home') }];

  return (
    <>
      <PriceTicker />
      <nav className="bg-light-surface dark:bg-dark-surface border-b border-light-border dark:border-dark-border sticky top-0 z-40 shadow-sm backdrop-blur-sm bg-opacity-95 dark:bg-opacity-95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <button
              onClick={() => onNavigate('home')}
              className="text-2xl font-bold text-bitget-cyan hover:text-bitget-cyan-light transition-colors"
            >
              Bitget Trading
            </button>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentPage === item.id
                    ? 'bg-bitget-cyan text-black'
                    : (item as any).isAdmin
                    ? 'text-bitget-cyan hover:bg-bitget-cyan/10 font-semibold'
                    : 'text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-bg dark:hover:bg-dark-surface-light'
                }`}
              >
                {(item as any).isAdmin && <Shield className="w-4 h-4 inline mr-2" />}
                {item.label}
              </button>
            ))}
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <div className="relative">
              <button
                onClick={() => setLanguageDropdownOpen(!languageDropdownOpen)}
                className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-bg dark:hover:bg-dark-surface-light"
              >
                <Globe className="w-4 h-4" />
              </button>
              {languageDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-md shadow-lg z-50 max-h-64 overflow-y-auto">
                  {languageOptions.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.code as any);
                        setLanguageDropdownOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-light-text dark:text-dark-text hover:bg-light-bg dark:hover:bg-dark-surface-light"
                    >
                      {lang.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => setCurrencyDropdownOpen(!currencyDropdownOpen)}
                className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-bg dark:hover:bg-dark-surface-light"
              >
                <DollarSign className="w-4 h-4" />
                <span>{currency.symbol}</span>
              </button>
              {currencyDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-md shadow-lg z-50 max-h-64 overflow-y-auto">
                  {currencies.map((curr) => (
                    <button
                      key={curr.code}
                      onClick={() => {
                        setCurrency(curr.code);
                        setCurrencyDropdownOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-light-text dark:text-dark-text hover:bg-light-bg dark:hover:bg-dark-surface-light"
                    >
                      {curr.symbol} {curr.code}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={toggleTheme}
              className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-bg dark:hover:bg-dark-surface-light transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-bitget-cyan" />
              ) : (
                <Moon className="w-5 h-5 text-light-text-secondary" />
              )}
            </button>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-bg dark:hover:bg-dark-surface-light"
                >
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt="Avatar"
                      className="w-6 h-6 rounded-full"
                    />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                  <span>{profile?.username || user.email}</span>
                </button>
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-md shadow-lg z-50">
                    <button
                      onClick={() => {
                        onNavigate('profile');
                        setProfileDropdownOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-light-text dark:text-dark-text hover:bg-light-bg dark:hover:bg-dark-surface-light"
                    >
                      Profile Settings
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => {
                          onNavigate('admin');
                          setProfileDropdownOpen(false);
                        }}
                        className="flex items-center space-x-2 w-full text-left px-4 py-2 text-sm text-bitget-cyan hover:bg-bitget-cyan/10 border-t border-light-border dark:border-dark-border"
                      >
                        <Shield className="w-4 h-4" />
                        <span>Admin Panel</span>
                      </button>
                    )}
                    <button
                      onClick={handleSignOut}
                      className="flex items-center space-x-2 w-full text-left px-4 py-2 text-sm text-light-text dark:text-dark-text hover:bg-light-bg dark:hover:bg-dark-surface-light border-t border-light-border dark:border-dark-border"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>{t('logout')}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => onNavigate('login')}
                className="btn-primary"
              >
                {t('login')}
              </button>
            )}
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-light-text-secondary dark:text-dark-text-secondary hover:text-bitget-cyan"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-light-surface dark:bg-dark-surface border-t border-light-border dark:border-dark-border">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center w-full text-left px-3 py-2 rounded-md text-base font-medium ${
                  currentPage === item.id
                    ? 'bg-bitget-cyan text-black'
                    : (item as any).isAdmin
                    ? 'text-bitget-cyan hover:bg-bitget-cyan/10 font-semibold'
                    : 'text-light-text dark:text-dark-text hover:bg-light-bg dark:hover:bg-dark-surface-light'
                }`}
              >
                {(item as any).isAdmin && <Shield className="w-4 h-4 mr-2" />}
                {item.label}
              </button>
            ))}
            {user && (
              <>
                <button
                  onClick={() => {
                    onNavigate('profile');
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-light-text dark:text-dark-text hover:bg-light-bg dark:hover:bg-dark-surface-light"
                >
                  Profile Settings
                </button>
                <button
                  onClick={() => {
                    handleSignOut();
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-light-text dark:text-dark-text hover:bg-light-bg dark:hover:bg-dark-surface-light"
                >
                  {t('logout')}
                </button>
              </>
            )}
            {!user && (
              <button
                onClick={() => {
                  onNavigate('login');
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium bg-bitget-cyan text-black"
              >
                {t('login')}
              </button>
            )}
          </div>
        </div>
      )}
      </nav>
    </>
  );
}

export default memo(Navigation);
