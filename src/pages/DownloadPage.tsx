import { useState } from 'react';
import {
  Fingerprint, BellRing, Zap, Download, ArrowLeft,
  Smartphone, X, Share, Plus, Home,
} from 'lucide-react';

interface DownloadPageProps {
  onNavigate: (page: string) => void;
}

const APK_LINK = 'https://drive.google.com/file/d/1WgUmTQRpE_Brd0DPDlMh1DuEGTYQ2WzW/view';
const APP_QR   = 'https://i.imgur.com/7nVT2zd.png';

const FEATURES = [
  { icon: Fingerprint, title: 'Biometric Shield',  desc: 'Unlock your portfolio instantly with Face ID and Touch ID.', color: '#00EBFF' },
  { icon: BellRing,    title: 'Push Insights',      desc: 'Get instant alerts for every market move.',                  color: '#B0E0E6' },
  { icon: Zap,         title: 'Zero Latency',       desc: 'Optimized for 99.9% uptime and microsecond execution.',     color: '#E6E6FA' },
];

// ── iOS Add-to-Home-Screen modal ──────────────────────────────────────────────
function IOSModal({ onClose }: { onClose: () => void }) {
  const steps = [
    {
      num: 1,
      icon: (
        <div className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0"
          style={{ background: 'rgba(0,122,255,0.15)', border: '1px solid rgba(0,122,255,0.35)' }}>
          {/* Safari share icon */}
          <Share className="w-4 h-4" style={{ color: '#007AFF' }} />
        </div>
      ),
      title: 'Tap the Share button',
      desc: (
        <>
          Open <span style={{ color: '#00EBFF' }}>vantixpro.eu</span> in{' '}
          <strong style={{ color: '#F5F5F0' }}>Safari</strong>, then tap the{' '}
          <strong style={{ color: '#F5F5F0' }}>Share</strong> icon{' '}
          <span className="inline-flex items-center justify-center w-5 h-5 rounded align-middle"
            style={{ background: 'rgba(0,122,255,0.2)', border: '1px solid rgba(0,122,255,0.3)' }}>
            <Share className="w-3 h-3" style={{ color: '#007AFF' }} />
          </span>{' '}
          at the bottom of the screen.
        </>
      ),
    },
    {
      num: 2,
      icon: (
        <div className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0"
          style={{ background: 'rgba(0,235,255,0.12)', border: '1px solid rgba(0,235,255,0.3)' }}>
          <Plus className="w-4 h-4" style={{ color: '#00EBFF' }} />
        </div>
      ),
      title: 'Tap "Add to Home Screen"',
      desc: (
        <>
          Scroll down in the share sheet and tap{' '}
          <strong style={{ color: '#F5F5F0' }}>"Add to Home Screen"</strong>.
        </>
      ),
    },
    {
      num: 3,
      icon: (
        <div className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0"
          style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)' }}>
          <Home className="w-4 h-4" style={{ color: '#10B981' }} />
        </div>
      ),
      title: 'Name it and tap Add',
      desc: (
        <>
          Keep the name <strong style={{ color: '#F5F5F0' }}>Vantix</strong> and tap{' '}
          <strong style={{ color: '#F5F5F0' }}>Add</strong> in the top-right corner.
          The app icon will appear on your Home Screen.
        </>
      ),
    },
  ];

  return (
    <div
      className="fixed inset-0 flex items-end sm:items-center justify-center px-3 pb-3 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', zIndex: 9990 }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ background: '#0f0d0d', border: '1px solid rgba(0,235,255,0.2)', boxShadow: '0 0 64px rgba(0,235,255,0.1), 0 24px 60px rgba(0,0,0,0.7)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Iridescent stripe */}
        <div style={{ height: 2, background: 'linear-gradient(90deg, transparent, #FFC0CB55, #E6E6FA77, #B0E0E6AA, #00EBFF66, transparent)' }} />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(0,235,255,0.1)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0"
              style={{ border: '1px solid rgba(0,235,255,0.25)', background: '#080808' }}>
              <img src="/vantix-logo.png" alt="Vantix" className="w-full h-full object-contain" />
            </div>
            <div>
              <p className="font-bold text-sm leading-none" style={{ color: '#F5F5F0' }}>Add Vantix to Home Screen</p>
              <p className="text-xs mt-1" style={{ color: '#5A6677' }}>iOS · Safari · vantixpro.eu</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
            style={{ background: 'rgba(255,255,255,0.06)', color: '#5A6677' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#F5F5F0')}
            onMouseLeave={e => (e.currentTarget.style.color = '#5A6677')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Steps */}
        <div className="px-5 py-5 space-y-5">
          {steps.map((s, i) => (
            <div key={i} className="flex items-start gap-4">
              <div className="relative flex-shrink-0">
                {s.icon}
                {/* Connector line */}
                {i < steps.length - 1 && (
                  <div className="absolute left-1/2 -translate-x-1/2 top-full w-px mt-1"
                    style={{ height: 20, background: 'linear-gradient(to bottom, rgba(0,235,255,0.2), transparent)' }} />
                )}
              </div>
              <div className="pt-0.5">
                <p className="font-semibold text-sm mb-1" style={{ color: '#F5F5F0' }}>
                  <span className="text-xs font-bold mr-1.5 px-1.5 py-0.5 rounded" style={{ background: 'rgba(0,235,255,0.1)', color: '#00EBFF' }}>
                    {s.num}
                  </span>
                  {s.title}
                </p>
                <p className="text-xs leading-relaxed" style={{ color: '#8899AA' }}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Info box */}
        <div className="mx-5 mb-5 px-4 py-3 rounded-xl text-xs leading-relaxed"
          style={{ background: 'rgba(0,235,255,0.04)', border: '1px solid rgba(0,235,255,0.1)', color: '#7A8899' }}>
          <span style={{ color: '#00EBFF' }}>✦ Tip:</span> Once installed, Vantix opens full-screen without any browser chrome — just like a native app.
        </div>

        {/* Open in Safari button */}
        <div className="px-5 pb-5">
          <a
            href="https://vantixpro.eu"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-200 active:scale-[0.98]"
            style={{ background: '#00EBFF', color: '#080808', textDecoration: 'none', boxShadow: '0 0 24px rgba(0,235,255,0.3)' }}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 0 36px rgba(0,235,255,0.5)')}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 0 24px rgba(0,235,255,0.3)')}
          >
            Open vantixpro.eu in Safari
          </a>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function DownloadPage({ onNavigate }: DownloadPageProps) {
  const [tab, setTab] = useState<'android' | 'ios'>('android');
  const [showIOSModal, setShowIOSModal] = useState(false);

  return (
    <div className="min-h-screen" style={{ background: '#080808', color: '#F5F5F0' }}>
      {showIOSModal && <IOSModal onClose={() => setShowIOSModal(false)} />}

      {/* Film grain */}
      <div className="fixed inset-0 pointer-events-none z-0" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.035'/%3E%3C/svg%3E")`,
        backgroundSize: '128px 128px',
      }} />
      <div className="fixed inset-0 pointer-events-none z-0" style={{
        background: 'radial-gradient(ellipse 60% 50% at 50% 30%, rgba(0,235,255,0.07) 0%, transparent 70%)',
      }} />
      <div className="fixed inset-0 pointer-events-none z-0" style={{
        backgroundImage: `linear-gradient(rgba(0,235,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,235,255,0.03) 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
      }} />

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-10 sm:py-16">

        {/* Back */}
        <button onClick={() => onNavigate('home')}
          className="flex items-center gap-2 mb-10 text-sm font-medium transition-colors"
          style={{ color: '#7A8899' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#00EBFF')}
          onMouseLeave={e => (e.currentTarget.style.color = '#7A8899')}
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>

        {/* Hero */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <img src="https://i.imgur.com/oJYd0t6.png" alt="Vantix" className="h-14 w-auto object-contain"
              style={{ filter: 'drop-shadow(0 0 12px rgba(0,235,255,0.6))' }} />
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 text-xs font-semibold tracking-widest uppercase"
            style={{ background: 'rgba(0,235,255,0.08)', border: '1px solid rgba(0,235,255,0.25)', color: '#00EBFF' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#00EBFF] animate-pulse" />
            Mobile App — Now Available
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 leading-tight"
            style={{ letterSpacing: '-0.03em', backgroundImage: 'linear-gradient(90deg, #00EBFF 0%, #B0E0E6 60%, #E6E6FA 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            The Future of Trading,<br />Now Portable.
          </h1>
          <p className="text-base sm:text-lg leading-relaxed max-w-md mx-auto" style={{ color: '#C0B8B8' }}>
            Experience the full power of Vantix Exchange in the palm of your hand.
          </p>
        </div>

        {/* Phone mockup */}
        <div className="flex justify-center mb-12">
          <div className="relative">
            <div className="absolute inset-[-40px] pointer-events-none" style={{
              background: 'radial-gradient(ellipse at 50% 50%, rgba(0,235,255,0.18) 0%, rgba(176,224,230,0.1) 35%, rgba(230,230,250,0.06) 60%, transparent 75%)',
              filter: 'blur(24px)',
            }} />
            <img src="https://i.imgur.com/qO5NNuu.png" alt="Vantix App"
              className="relative w-64 sm:w-72 object-contain drop-shadow-2xl"
              style={{ filter: 'drop-shadow(0 0 40px rgba(0,235,255,0.2))' }} />
          </div>
        </div>

        {/* Divider */}
        <div className="mb-10" style={{ height: 1, background: 'linear-gradient(90deg, transparent, #FFC0CB44, #E6E6FA66, #B0E0E699, #E6E6FA66, #FFC0CB44, transparent)' }} />

        {/* ── TABS ── */}
        <div className="flex gap-2 p-1 rounded-2xl mb-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(0,235,255,0.1)' }}>
          {([
            { key: 'android', label: 'Android APK', emoji: '🤖' },
            { key: 'ios',     label: 'iOS Lite App', emoji: '🍎' },
          ] as const).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all duration-200"
              style={tab === t.key ? {
                background: 'rgba(0,235,255,0.12)',
                border: '1.5px solid rgba(0,235,255,0.45)',
                color: '#00EBFF',
                boxShadow: '0 0 20px rgba(0,235,255,0.12)',
              } : {
                background: 'transparent',
                border: '1.5px solid transparent',
                color: '#7A8899',
              }}
            >
              <span>{t.emoji}</span> {t.label}
            </button>
          ))}
        </div>

        {/* ── ANDROID TAB ── */}
        {tab === 'android' && (
          <div className="rounded-2xl p-6 sm:p-8 text-center relative overflow-hidden mb-6"
            style={{ background: '#0f0d0d', border: '1px solid rgba(0,235,255,0.18)', boxShadow: '0 0 48px rgba(0,235,255,0.06)' }}>
            <div className="absolute left-0 right-0 top-0" style={{ height: 2, background: 'linear-gradient(90deg, transparent, #FFC0CB55, #E6E6FA77, #B0E0E6AA, #00EBFF66, transparent)' }} />

            <p className="text-xs font-semibold tracking-widest uppercase mb-6" style={{ color: '#7A8899' }}>
              Scan to Download
            </p>
            <div className="flex justify-center mb-5">
              <div className="rounded-2xl p-3 inline-block"
                style={{ background: '#ffffff', border: '2px solid rgba(0,235,255,0.7)', boxShadow: '0 0 32px rgba(0,235,255,0.5), 0 0 64px rgba(0,235,255,0.18)' }}>
                <img src={APP_QR} alt="Download QR" className="w-48 h-48 sm:w-56 sm:h-56 object-contain" />
              </div>
            </div>
            <p className="text-sm leading-relaxed mb-6 max-w-xs mx-auto" style={{ color: '#A0B0C0' }}>
              Scan the QR Code with your Android device to download the APK.
            </p>
            <a href={APK_LINK} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full max-w-xs py-4 rounded-xl font-bold text-sm transition-all duration-300 active:scale-[0.98]"
              style={{ background: 'transparent', color: '#00EBFF', border: '1.5px solid rgba(0,235,255,0.55)', boxShadow: '0 0 20px rgba(0,235,255,0.15)', textDecoration: 'none', backdropFilter: 'blur(8px)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,235,255,0.08)'; e.currentTarget.style.boxShadow = '0 0 32px rgba(0,235,255,0.35), inset 0 0 20px rgba(0,235,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(0,235,255,0.85)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.boxShadow = '0 0 20px rgba(0,235,255,0.15)'; e.currentTarget.style.borderColor = 'rgba(0,235,255,0.55)'; }}
            >
              <Download className="w-4 h-4" /> Download APK
            </a>
            <p className="text-xs mt-3" style={{ color: '#5A6677' }}>Android 8.0+ required</p>
          </div>
        )}

        {/* ── IOS TAB ── */}
        {tab === 'ios' && (
          <div className="rounded-2xl overflow-hidden mb-6"
            style={{ background: '#0f0d0d', border: '1px solid rgba(0,235,255,0.18)', boxShadow: '0 0 48px rgba(0,235,255,0.06)' }}>
            <div style={{ height: 2, background: 'linear-gradient(90deg, transparent, #FFC0CB55, #E6E6FA77, #B0E0E6AA, #00EBFF66, transparent)' }} />

            <div className="p-6 sm:p-8 text-center">
              {/* iOS icon */}
              <div className="flex justify-center mb-5">
                <div className="relative">
                  <div className="w-24 h-24 rounded-[22%] overflow-hidden flex items-center justify-center"
                    style={{ background: 'linear-gradient(145deg, #0a0808, #1a1414)', border: '2px solid rgba(0,235,255,0.3)', boxShadow: '0 0 40px rgba(0,235,255,0.2)' }}>
                    <img src="/vantix-logo.png" alt="Vantix" className="w-16 h-16 object-contain"
                      style={{ filter: 'drop-shadow(0 0 8px rgba(0,235,255,0.5))' }} />
                  </div>
                  {/* Shine */}
                  <div className="absolute inset-0 rounded-[22%] pointer-events-none"
                    style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%)' }} />
                </div>
              </div>

              <h3 className="text-xl font-bold mb-2" style={{ color: '#F5F5F0' }}>Vantix — iOS Lite App</h3>
              <p className="text-sm leading-relaxed mb-2 max-w-xs mx-auto" style={{ color: '#A0B0C0' }}>
                Add Vantix to your iPhone Home Screen for a full-screen, app-like experience — no App Store needed.
              </p>

              {/* Feature chips */}
              <div className="flex flex-wrap justify-center gap-2 mb-6">
                {['Full-screen mode', 'No browser bar', 'App icon on Home', 'Fast & offline-ready'].map(f => (
                  <span key={f} className="text-xs px-2.5 py-1 rounded-full"
                    style={{ background: 'rgba(0,235,255,0.08)', border: '1px solid rgba(0,235,255,0.18)', color: '#8899AA' }}>
                    {f}
                  </span>
                ))}
              </div>

              <button
                onClick={() => setShowIOSModal(true)}
                className="inline-flex items-center justify-center gap-2 w-full max-w-xs py-4 rounded-xl font-bold text-sm transition-all duration-300 active:scale-[0.98]"
                style={{ background: '#00EBFF', color: '#080808', boxShadow: '0 0 32px rgba(0,235,255,0.35)' }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 0 48px rgba(0,235,255,0.55)')}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 0 32px rgba(0,235,255,0.35)')}
              >
                <Smartphone className="w-4 h-4" /> How to Install on iPhone
              </button>
              <p className="text-xs mt-3" style={{ color: '#5A6677' }}>iOS 14+ · Safari required</p>
            </div>
          </div>
        )}

        {/* Features */}
        <div className="space-y-3 mb-14">
          {FEATURES.map((f, i) => (
            <div key={i} className="flex items-start gap-4 p-5 rounded-2xl transition-all duration-200"
              style={{ background: '#0f0d0d', border: '1px solid rgba(0,235,255,0.1)' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(0,235,255,0.3)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(0,235,255,0.1)')}
            >
              <div className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center"
                style={{ background: `${f.color}14`, border: `1px solid ${f.color}33`, backdropFilter: 'blur(10px)', boxShadow: `0 0 16px ${f.color}18` }}>
                <f.icon className="w-5 h-5" style={{ color: f.color }} />
              </div>
              <div>
                <h3 className="font-bold text-sm mb-1" style={{ color: '#F5F5F0' }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#A0B0C0' }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mb-10" style={{ height: 1, background: 'linear-gradient(90deg, transparent, #FFC0CB33, #E6E6FA44, #B0E0E666, transparent)' }} />
        <p className="text-center text-xs leading-relaxed" style={{ color: '#5A6677' }}>
          Vantix Trading app requires Android 8.0+ or iOS 14+. By downloading you agree to our Terms of Service.
        </p>
      </div>
    </div>
  );
}
