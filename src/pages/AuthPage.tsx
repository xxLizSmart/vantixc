import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react';

interface AuthPageProps {
  onNavigate: (page: string) => void;
}

export default function AuthPage({ onNavigate }: AuthPageProps) {
  const [isLogin, setIsLogin]         = useState(true);
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]             = useState('');
  const [info, setInfo]               = useState('');
  const [submitting, setSubmitting]   = useState(false);

  const { signIn, signUp, user } = useAuth();
  const { t } = useLanguage();

  // ── Redirect as soon as user is confirmed set in context ─────────────────
  // This fires after onAuthStateChange sets the user — guaranteed non-null
  useEffect(() => {
    if (user) {
      onNavigate('dashboard');
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setSubmitting(true);

    try {
      if (isLogin) {
        // signIn fires → onAuthStateChange sets user → useEffect above redirects
        await signIn(email, password);
        // No explicit navigate here — wait for user state to update
      } else {
        await signUp(email, password);
        // register_user RPC auto-signs-in → useEffect redirect handles navigation
        // If fallback standard signUp was used and email confirmation is OFF → same
        // Show brief success in case the redirect takes a moment
        setInfo('Account created! Signing you in…');
      }
    } catch (err: any) {
      const msg: string = err?.message || 'An error occurred';
      if (msg.includes('Invalid login credentials')) {
        setError('Incorrect email or password. Please try again.');
      } else if (msg.includes('Email not confirmed')) {
        setError('Please confirm your email before logging in.');
      } else if (msg.includes('User already registered')) {
        setError('An account with this email already exists. Please log in.');
        setIsLogin(true);
      } else if (msg.includes('Password should be') || msg.includes('at least 6')) {
        setError('Password must be at least 6 characters.');
      } else if (msg.toLowerCase().includes('rate limit') || msg.toLowerCase().includes('email')) {
        setError('Signup is temporarily limited. Please run Step 4 SQL from the setup page to enable instant signups, or try again in a few minutes.');
      } else {
        setError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const switchMode = () => {
    setIsLogin(v => !v);
    setError('');
    setInfo('');
    setPassword('');
    setShowPassword(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: '#080808' }}>
      <div className="max-w-md w-full">
        <div className="rounded-2xl overflow-hidden shadow-2xl"
          style={{ background: '#0f0d0d', border: '1px solid rgba(0,235,255,0.2)' }}>

          {/* Iridescent top stripe */}
          <div style={{ height: 2, background: 'linear-gradient(90deg, transparent, #FFC0CB55, #E6E6FA77, #B0E0E6AA, #00EBFF66, transparent)' }} />

          <div className="p-8">
            {/* Logo + heading */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-4">
                <img
                  src="/vantix-logo.png"
                  alt="Vantix"
                  className="h-14 w-auto object-contain"
                  onError={e => { e.currentTarget.style.display = 'none'; }}
                  style={{ filter: 'drop-shadow(0 0 12px rgba(0,235,255,0.6))' }}
                />
              </div>
              <h2 className="text-2xl font-bold" style={{ color: '#F5F5F0' }}>
                {isLogin ? t('login') : t('signup')}
              </h2>
              <p className="mt-1.5 text-sm" style={{ color: '#C0B8B8' }}>
                {isLogin ? 'Welcome back to Vantix Trading' : 'Start your trading journey'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold tracking-widest uppercase mb-2"
                  style={{ color: '#7A8899' }}>
                  {t('email')}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2"
                    style={{ color: '#554e4e', width: 18, height: 18 }} />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    placeholder="your@email.com"
                    className="w-full pl-10 pr-4 py-3.5 rounded-xl text-base focus:outline-none transition-all"
                    style={{ background: '#0a0808', border: '1.5px solid rgba(0,235,255,0.15)', color: '#F5F5F0' }}
                    onFocus={e  => (e.currentTarget.style.borderColor = 'rgba(0,235,255,0.5)')}
                    onBlur={e   => (e.currentTarget.style.borderColor = 'rgba(0,235,255,0.15)')}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold tracking-widest uppercase mb-2"
                  style={{ color: '#7A8899' }}>
                  {t('password')}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2"
                    style={{ color: '#554e4e', width: 18, height: 18 }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={6}
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-12 py-3.5 rounded-xl text-base focus:outline-none transition-all"
                    style={{ background: '#0a0808', border: '1.5px solid rgba(0,235,255,0.15)', color: '#F5F5F0' }}
                    onFocus={e  => (e.currentTarget.style.borderColor = 'rgba(0,235,255,0.5)')}
                    onBlur={e   => (e.currentTarget.style.borderColor = 'rgba(0,235,255,0.15)')}
                  />
                  {/* Eye toggle */}
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 p-0.5 rounded transition-colors"
                    style={{ color: showPassword ? '#00EBFF' : '#554e4e' }}
                  >
                    {showPassword
                      ? <EyeOff style={{ width: 18, height: 18 }} />
                      : <Eye    style={{ width: 18, height: 18 }} />}
                  </button>
                </div>
                {!isLogin && (
                  <p className="mt-1.5 text-xs" style={{ color: '#5A6677' }}>Minimum 6 characters</p>
                )}
              </div>

              {/* Success info */}
              {info && (
                <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl text-sm"
                  style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)', color: '#10B981' }}>
                  <span className="flex-shrink-0">✓</span>
                  <span>{info}</span>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl text-sm"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444' }}>
                  <span className="flex-shrink-0">⚠</span>
                  <span>{error}</span>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 rounded-xl font-bold text-base transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                style={{
                  background: submitting ? '#1a1414' : '#00EBFF',
                  color:      submitting ? '#5A6677' : '#080808',
                  boxShadow:  submitting ? 'none'    : '0 0 32px rgba(0,235,255,0.3)',
                  border:     submitting ? '1px solid rgba(255,255,255,0.07)' : 'none',
                }}
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                      style={{ borderColor: '#5A6677', borderTopColor: 'transparent' }} />
                    {isLogin ? 'Signing in…' : 'Creating account…'}
                  </span>
                ) : (
                  isLogin ? t('login') : t('signup')
                )}
              </button>
            </form>

            {/* Switch mode */}
            <div className="mt-6 text-center">
              <button
                onClick={switchMode}
                className="text-sm"
                style={{ color: '#C0B8B8' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#00EBFF')}
                onMouseLeave={e => (e.currentTarget.style.color = '#C0B8B8')}
              >
                {isLogin ? "Don't have an account? " : 'Already have an account? '}
                <span style={{ color: '#00EBFF', fontWeight: 600 }}>
                  {isLogin ? 'Sign up' : 'Log in'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
