import { useState, useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown, Shield, Zap, Users, Globe, Lock, Coins, Award, Star, ArrowRight, ChevronRight } from 'lucide-react';
import { useCryptoPrices } from '../contexts/CryptoPriceContext';
import CryptoIcon from '../components/CryptoIcon';

interface LandingPageProps {
  onNavigate: (page: string) => void;
}

// Sparkline mini-chart using SVG
function Sparkline({ up }: { up: boolean }) {
  const points = up
    ? '0,28 8,22 16,18 24,20 32,12 40,15 48,8 56,10 64,4 72,7 80,2'
    : '0,4 8,8 16,6 24,12 32,10 40,16 48,14 56,20 64,18 72,24 80,26';
  return (
    <svg width="80" height="30" viewBox="0 0 80 30" fill="none" className="opacity-80">
      <polyline
        points={points}
        stroke={up ? '#10B981' : '#EF4444'}
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Demo chart — animated cyan sine wave
function CyanChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let frame = 0;
    let raf: number;
    const draw = () => {
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(0,235,255,0.06)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) {
        const y = (H / 4) * i;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }
      for (let i = 0; i <= 8; i++) {
        const x = (W / 8) * i;
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, 'rgba(0,235,255,0.25)');
      grad.addColorStop(1, 'rgba(0,235,255,0)');
      ctx.beginPath();
      ctx.moveTo(0, H);
      for (let x = 0; x <= W; x++) {
        const t = (x / W) * Math.PI * 3 + frame * 0.018;
        const y = H * 0.5 - Math.sin(t) * H * 0.22 - Math.sin(t * 1.7 + 1) * H * 0.08;
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.lineTo(W, H); ctx.closePath();
      ctx.fillStyle = grad; ctx.fill();
      ctx.beginPath();
      for (let x = 0; x <= W; x++) {
        const t = (x / W) * Math.PI * 3 + frame * 0.018;
        const y = H * 0.5 - Math.sin(t) * H * 0.22 - Math.sin(t * 1.7 + 1) * H * 0.08;
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = '#00EBFF'; ctx.lineWidth = 2; ctx.stroke();
      frame++;
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={canvasRef} width={340} height={80} style={{ width: '100%', height: 80 }} />;
}

const DEMO_ASSETS = [
  { symbol: 'BTC',  name: 'Bitcoin',  price: 67702.98, change: 0.36,  vol: '24.8B', color: '#F7931A', up: true  },
  { symbol: 'ETH',  name: 'Ethereum', price: 3521.44,  change: -0.45, vol: '12.3B', color: '#627EEA', up: false },
  { symbol: 'SOL',  name: 'Solana',   price: 189.22,   change: 2.14,  vol: '4.1B',  color: '#9945FF', up: true  },
  { symbol: 'XRP',  name: 'Ripple',   price: 0.6312,   change: -1.02, vol: '2.7B',  color: '#346AA9', up: false },
  { symbol: 'USDT', name: 'Tether',   price: 1.0001,   change: 0.01,  vol: '58.2B', color: '#26A17B', up: true  },
];

export default function LandingPage({ onNavigate }: LandingPageProps) {
  const { prices } = useCryptoPrices();
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  const assets = DEMO_ASSETS.map(a => {
    const live = prices[a.symbol];
    return live
      ? { ...a, price: live.price_usd, change: live.price_change_24h, vol: a.vol, up: live.price_change_24h >= 0 }
      : a;
  });

  return (
    <div className="min-h-screen" style={{ background: '#080808', color: '#F5F5F5' }}>

      {/* ─── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Film grain */}
        <div className="absolute inset-0 pointer-events-none z-10" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`,
          backgroundSize: '128px 128px',
        }} />
        {/* Radial glow */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 80% 60% at 60% 50%, rgba(0,235,255,0.07) 0%, transparent 70%)',
        }} />
        {/* Scan lines */}
        <div className="absolute inset-0 pointer-events-none z-10" style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.04) 3px, rgba(0,0,0,0.04) 4px)',
        }} />
        {/* Grid */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: `
            linear-gradient(rgba(0,235,255,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,235,255,0.04) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }} />
        {/* Orbs */}
        <div className="absolute right-[-80px] top-[-120px] w-[700px] h-[700px] pointer-events-none" style={{
          background: 'radial-gradient(ellipse at 40% 40%, rgba(0,235,255,0.18) 0%, rgba(176,224,230,0.08) 30%, rgba(230,230,250,0.05) 55%, transparent 70%)',
          borderRadius: '40% 60% 55% 45% / 50% 40% 60% 50%',
          filter: 'blur(40px)',
          animation: 'orbFloat 8s ease-in-out infinite',
        }} />
        <div className="absolute right-[0px] top-[40px] w-[520px] h-[520px] pointer-events-none" style={{
          background: 'radial-gradient(ellipse at 50% 50%, rgba(255,192,203,0.06) 0%, rgba(230,230,250,0.04) 40%, transparent 65%)',
          borderRadius: '55% 45% 40% 60% / 45% 55% 45% 55%',
          filter: 'blur(30px)',
          animation: 'orbFloat 11s ease-in-out infinite reverse',
        }} />

        <div className="relative z-20 max-w-7xl mx-auto px-6 lg:px-12 py-24 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* LEFT */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-8 text-xs font-semibold tracking-widest uppercase" style={{
                borderColor: 'rgba(0,235,255,0.3)',
                background: 'rgba(0,235,255,0.06)',
                color: '#00EBFF',
              }}>
                <span className="w-1.5 h-1.5 rounded-full bg-[#00EBFF] animate-pulse" />
                Live Markets · Neo-Digital Trading
              </div>

              <h1 className="font-bold leading-none mb-6" style={{ fontSize: 'clamp(3rem, 6vw, 5.5rem)', letterSpacing: '-0.02em' }}>
                <span style={{ color: '#F5F5F5' }}>Trade Crypto</span><br />
                <span style={{
                  backgroundImage: 'linear-gradient(90deg, #00EBFF 0%, #B0E0E6 50%, #E6E6FA 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>Like a Pro</span>
              </h1>

              <p className="text-lg mb-10 max-w-lg leading-relaxed" style={{ color: '#C0B8B8' }}>
                Your innovative platform for comprehensive trading and decentralized assets. High-velocity execution, institutional-grade tools — now in your hands.
              </p>

              <div className="flex flex-wrap gap-4 mb-12">
                <button
                  onClick={() => onNavigate('login')}
                  className="group flex items-center gap-2 px-7 py-4 rounded-lg font-semibold text-base transition-all duration-300"
                  style={{
                    background: '#00EBFF',
                    color: '#080808',
                    boxShadow: '0 0 32px rgba(0,235,255,0.35), 0 0 8px rgba(0,235,255,0.2)',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 0 48px rgba(0,235,255,0.55), 0 0 16px rgba(0,235,255,0.35)')}
                  onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 0 32px rgba(0,235,255,0.35), 0 0 8px rgba(0,235,255,0.2)')}
                >
                  Start Trading Free
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={() => onNavigate('login')}
                  className="flex items-center gap-2 px-7 py-4 rounded-lg font-semibold text-base transition-all duration-300"
                  style={{
                    background: 'transparent',
                    color: '#00EBFF',
                    border: '1px solid rgba(0,235,255,0.4)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = '#00EBFF';
                    e.currentTarget.style.background = 'rgba(0,235,255,0.06)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'rgba(0,235,255,0.4)';
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  Explore Markets
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Mini stats */}
              <div className="flex gap-8">
                {[
                  { val: '$2.4B+', lbl: 'Volume'  },
                  { val: '50K+',   lbl: 'Traders'  },
                  { val: '99.9%',  lbl: 'Uptime'   },
                ].map((s, i) => (
                  <div key={i} className="flex flex-col">
                    <span className="text-2xl font-bold" style={{ color: '#00EBFF' }}>{s.val}</span>
                    <span className="text-xs tracking-wider uppercase" style={{ color: '#A0A8B0' }}>{s.lbl}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT — markets card */}
            <div className="relative">
              <div className="absolute -top-4 -right-4 w-24 h-24 pointer-events-none" style={{
                background: 'radial-gradient(circle, rgba(255,192,203,0.4) 0%, rgba(230,230,250,0.2) 40%, transparent 70%)',
                filter: 'blur(8px)',
              }} />

              <div className="relative rounded-2xl overflow-hidden" style={{
                background: 'rgba(18,14,14,0.85)',
                border: '1px solid rgba(0,235,255,0.18)',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 8px 64px rgba(0,235,255,0.08), inset 0 1px 0 rgba(255,255,255,0.04)',
              }}>
                {/* Panel header */}
                <div className="px-6 pt-5 pb-3 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(0,235,255,0.1)' }}>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#00EBFF] animate-pulse" />
                    <span className="font-semibold text-sm tracking-wide" style={{ color: '#00EBFF' }}>Vantix Exchange</span>
                  </div>
                  <div className="flex gap-3 text-xs" style={{ color: '#8899AA' }}>
                    <span>24H</span><span style={{ color: '#00EBFF' }}>7D</span><span>1M</span>
                  </div>
                </div>

                {/* Iridescent divider */}
                <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, #FFC0CB44, #E6E6FA55, #B0E0E6AA, transparent)' }} />

                {/* Chart */}
                <div className="px-4 pt-3 pb-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs" style={{ color: '#8899AA' }}>BTC/USDT</span>
                    <span className="text-xs font-semibold" style={{ color: '#10B981' }}>+0.36%</span>
                  </div>
                  <CyanChart />
                </div>

                <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, #FFC0CB44, #E6E6FA55, #B0E0E6AA, transparent)', margin: '4px 0' }} />

                {/* Column headers */}
                <div className="grid grid-cols-4 px-6 py-2 text-xs font-medium tracking-wider uppercase" style={{ color: '#7A8899' }}>
                  <span>Asset</span>
                  <span className="text-right">Price</span>
                  <span className="text-right">24H</span>
                  <span className="text-right">Volume</span>
                </div>

                {/* Asset rows */}
                <div className="pb-4">
                  {assets.map((asset, i) => (
                    <div
                      key={asset.symbol}
                      className="grid grid-cols-4 items-center px-6 py-3 cursor-pointer transition-all duration-200"
                      style={{
                        background: hoveredRow === i
                          ? 'linear-gradient(90deg, rgba(0,235,255,0.05), rgba(176,224,230,0.04), rgba(230,230,250,0.03))'
                          : 'transparent',
                        borderLeft: hoveredRow === i ? '2px solid rgba(0,235,255,0.4)' : '2px solid transparent',
                      }}
                      onMouseEnter={() => setHoveredRow(i)}
                      onMouseLeave={() => setHoveredRow(null)}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <CryptoIcon symbol={asset.symbol} size={28} />
                        <div className="min-w-0">
                          <div className="text-xs font-semibold" style={{ color: '#00EBFF' }}>{asset.symbol}</div>
                          <div className="text-xs truncate" style={{ color: '#8899AA' }}>{asset.name}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold" style={{ color: '#F5F5F0' }}>
                          {asset.price >= 1000
                            ? `$${asset.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            : asset.price >= 1 ? `$${asset.price.toFixed(2)}`
                            : `$${asset.price.toFixed(4)}`}
                        </div>
                        <div className="w-full flex justify-end mt-1">
                          <Sparkline up={asset.up} />
                        </div>
                      </div>
                      <div className={`text-right text-sm font-semibold ${asset.up ? 'text-emerald-400' : 'text-red-400'}`}>
                        <div className="flex items-center justify-end gap-1">
                          {asset.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {asset.up ? '+' : ''}{asset.change.toFixed(2)}%
                        </div>
                      </div>
                      <div className="text-right text-xs" style={{ color: '#00EBFF', opacity: 0.7 }}>{asset.vol}</div>
                    </div>
                  ))}
                </div>

                <div className="absolute bottom-0 right-0 w-8 h-8" style={{
                  background: 'radial-gradient(circle, rgba(255,192,203,0.5) 0%, rgba(230,230,250,0.3) 40%, transparent 70%)',
                  filter: 'blur(4px)',
                }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── DOWNLOAD APP ───────────────────────────────────────────────────── */}
      <section className="py-20 px-6 overflow-hidden" style={{ background: '#3a3434' }}>
        <div className="max-w-6xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden" style={{
            background: 'rgba(8,8,8,0.55)',
            border: '1px solid rgba(0,235,255,0.16)',
            backdropFilter: 'blur(20px)',
          }}>
            {/* Iridescent top stripe */}
            <div style={{ height: 2, background: 'linear-gradient(90deg, transparent, #FFC0CB55, #E6E6FA77, #B0E0E6AA, #00EBFF66, transparent)' }} />

            <div className="grid lg:grid-cols-2 gap-0 items-center">
              {/* LEFT — copy + CTA */}
              <div className="p-8 sm:p-12 lg:p-14">
                {/* Logo */}
                <div className="flex items-center gap-3 mb-8">
                  <img src="https://i.imgur.com/oJYd0t6.png" alt="Vantix" className="h-9 w-auto object-contain"
                    style={{ filter: 'drop-shadow(0 0 6px rgba(0,235,255,0.5))' }} />
                  <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#00EBFF' }}>Mobile App</span>
                </div>

                {/* Live badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 text-xs font-semibold tracking-wider uppercase" style={{
                  background: 'rgba(0,235,255,0.08)',
                  border: '1px solid rgba(0,235,255,0.25)',
                  color: '#00EBFF',
                }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00EBFF] animate-pulse" />
                  Now Available
                </div>

                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 leading-tight" style={{
                  color: '#00EBFF',
                  letterSpacing: '-0.02em',
                }}>
                  Trade Anywhere.<br />Anytime.
                </h2>

                <p className="text-base leading-relaxed mb-8 max-w-sm" style={{ color: '#C0B8B8' }}>
                  Experience the full power of the Vantix Exchange in the palm of your hand. Lightning-fast execution meets mobile freedom.
                </p>

                {/* Glassmorphism CTA button with iridescent hover */}
                <button
                  onClick={() => onNavigate('download')}
                  className="group relative flex items-center gap-3 px-7 py-4 rounded-xl font-bold text-sm transition-all duration-300 overflow-hidden"
                  style={{
                    background: 'rgba(0,235,255,0.08)',
                    border: '1.5px solid rgba(0,235,255,0.45)',
                    color: '#00EBFF',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 0 24px rgba(0,235,255,0.1)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.boxShadow = '0 0 40px rgba(0,235,255,0.25), inset 0 0 20px rgba(0,235,255,0.06)';
                    e.currentTarget.style.borderColor = 'rgba(0,235,255,0.8)';
                    e.currentTarget.style.background = 'rgba(0,235,255,0.13)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.boxShadow = '0 0 24px rgba(0,235,255,0.1)';
                    e.currentTarget.style.borderColor = 'rgba(0,235,255,0.45)';
                    e.currentTarget.style.background = 'rgba(0,235,255,0.08)';
                  }}
                >
                  {/* Iridescent shimmer on hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{
                    background: 'linear-gradient(135deg, rgba(255,192,203,0.1), rgba(230,230,250,0.08), rgba(176,224,230,0.12), rgba(0,235,255,0.08))',
                  }} />
                  <svg className="w-5 h-5 relative" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z" fill="currentColor" opacity="0.3"/>
                    <rect x="7" y="3" width="10" height="15" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                    <rect x="9" y="6" width="6" height="8" rx="1" fill="currentColor" opacity="0.2"/>
                    <circle cx="12" cy="19" r="1" fill="currentColor"/>
                  </svg>
                  <span className="relative">Get the Vantix App</span>
                  <svg className="w-4 h-4 relative group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </button>

                {/* Trust indicators */}
                <div className="flex items-center gap-5 mt-6">
                  {[
                    { val: '4.9★', lbl: 'App Rating' },
                    { val: '50K+', lbl: 'Downloads' },
                    { val: 'Free', lbl: 'No Hidden Fees' },
                  ].map((s, i) => (
                    <div key={i}>
                      <div className="text-sm font-bold" style={{ color: '#00EBFF' }}>{s.val}</div>
                      <div className="text-xs" style={{ color: '#7A8899' }}>{s.lbl}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* RIGHT — phone mockup */}
              <div className="relative flex items-end justify-center lg:justify-end px-6 pb-0 pt-8 lg:pt-0 overflow-hidden" style={{ minHeight: 340 }}>
                {/* Multi-layer iridescent glow */}
                <div className="absolute inset-0 pointer-events-none" style={{
                  background: 'radial-gradient(ellipse 80% 90% at 60% 60%, rgba(0,235,255,0.15) 0%, rgba(176,224,230,0.08) 35%, rgba(230,230,250,0.05) 60%, transparent 75%)',
                  filter: 'blur(30px)',
                }} />
                <div className="absolute inset-0 pointer-events-none" style={{
                  background: 'radial-gradient(ellipse 60% 70% at 60% 60%, rgba(255,192,203,0.07) 0%, rgba(230,230,250,0.04) 50%, transparent 70%)',
                  filter: 'blur(20px)',
                }} />
                <img
                  src="https://i.imgur.com/qO5NNuu.png"
                  alt="Vantix App"
                  className="relative max-h-80 lg:max-h-96 w-auto object-contain"
                  style={{
                    filter: 'drop-shadow(0 0 32px rgba(0,235,255,0.18)) drop-shadow(0 20px 40px rgba(0,0,0,0.6))',
                    transform: 'translateY(0)',
                    animation: 'appFloat 6s ease-in-out infinite',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── STATS PODS ─────────────────────────────────────────────────────── */}
      <section className="py-20 px-6" style={{ background: '#080808' }}>
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { val: '$2.4B+', lbl: 'Daily Volume',    icon: TrendingUp, desc: 'Total 24h traded' },
              { val: '50K+',   lbl: 'Active Traders',  icon: Users,      desc: 'Worldwide users'  },
              { val: '99.9%',  lbl: 'Platform Uptime', icon: Zap,        desc: 'Enterprise SLA'   },
            ].map((pod, i) => (
              <div key={i} className="relative rounded-xl p-8 transition-all duration-300" style={{
                background: 'rgba(8,8,8,0.6)',
                border: '1px solid rgba(0,235,255,0.15)',
                backdropFilter: 'blur(10px)',
              }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(0,235,255,0.5)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(0,235,255,0.15)')}
              >
                <div style={{ height: 1, background: 'linear-gradient(90deg, #00EBFF33, #B0E0E688, transparent)', position: 'absolute', top: 0, left: 0, right: 0 }} />
                <pod.icon className="w-8 h-8 mb-4" style={{ color: '#00EBFF' }} />
                <div className="text-5xl font-bold mb-1" style={{ color: '#00EBFF' }}>{pod.val}</div>
                <div className="text-sm font-semibold mb-1" style={{ color: '#F5F5F0' }}>{pod.lbl}</div>
                <div className="text-xs" style={{ color: '#A0B0C0' }}>{pod.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ──────────────────────────────────────────────────────── */}
      <section className="py-24 px-6" style={{ background: '#080808' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: '#F5F5F0', letterSpacing: '-0.02em' }}>
              Why Choose <span style={{ color: '#00EBFF' }}>Vantix Trading</span>
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: '#C0B8B8' }}>
              High-velocity, modern trading infrastructure built for the next generation of crypto investors
            </p>
          </div>
          <div className="mb-16" style={{ height: 1, background: 'linear-gradient(90deg, transparent, #FFC0CB44, #E6E6FA66, #B0E0E699, #E6E6FA66, #FFC0CB44, transparent)' }} />
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: TrendingUp, title: 'Advanced Trading',  desc: 'Real-time charts and precision tools for professional traders' },
              { icon: Shield,     title: 'Secure Platform',   desc: 'Bank-level security with multi-layer encryption and KYC' },
              { icon: Zap,        title: 'Instant Execution', desc: 'Lightning-fast trade execution with multiple duration options' },
              { icon: Users,      title: '24/7 Support',      desc: 'Round-the-clock customer support for all your trading needs' },
            ].map((f, i) => (
              <div key={i} className="p-7 rounded-xl transition-all duration-300 cursor-default" style={{
                background: '#3a3434',
                border: '1px solid rgba(0,235,255,0.1)',
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'rgba(0,235,255,0.4)';
                  e.currentTarget.style.boxShadow = '0 0 32px rgba(0,235,255,0.06), inset 0 0 0 1px rgba(176,224,230,0.08)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'rgba(0,235,255,0.1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-5" style={{ background: 'rgba(0,235,255,0.1)' }}>
                  <f.icon className="w-6 h-6" style={{ color: '#00EBFF' }} />
                </div>
                <h3 className="font-semibold text-base mb-2" style={{ color: '#F5F5F0' }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#C0B8B8' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ───────────────────────────────────────────────────── */}
      <section className="py-24 px-6" style={{ background: '#3a3434' }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: '#F5F5F0', letterSpacing: '-0.02em' }}>
              How It Works
            </h2>
            <p style={{ color: '#C0B8B8' }}>Get started with Vantix in four simple steps</p>
          </div>
          <div className="space-y-4">
            {[
              { n: '01', t: 'Create Account',  d: 'Sign up with your email and complete KYC verification in minutes' },
              { n: '02', t: 'Deposit Funds',   d: 'Add funds using crypto wallets — TRC20, ERC20, BTC, or ETH' },
              { n: '03', t: 'Start Trading',   d: 'Choose your trade duration and amount, then predict the market direction' },
              { n: '04', t: 'Earn Profits',    d: 'Win trades and earn up to 50% profit on your capital' },
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-8 p-7 rounded-xl transition-all duration-300" style={{
                background: 'rgba(8,8,8,0.5)',
                border: '1px solid rgba(0,235,255,0.12)',
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'rgba(0,235,255,0.35)';
                  e.currentTarget.style.background = 'rgba(0,235,255,0.03)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'rgba(0,235,255,0.12)';
                  e.currentTarget.style.background = 'rgba(8,8,8,0.5)';
                }}
              >
                <span className="text-5xl font-bold flex-shrink-0 w-16 text-center" style={{ color: 'rgba(0,235,255,0.4)' }}>{step.n}</span>
                <div>
                  <h3 className="text-xl font-semibold mb-1" style={{ color: '#00EBFF' }}>{step.t}</h3>
                  <p className="leading-relaxed" style={{ color: '#C0B8B8' }}>{step.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ───────────────────────────────────────────────────── */}
      <section className="py-24 px-6" style={{ background: '#080808' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: '#F5F5F0', letterSpacing: '-0.02em' }}>
              What Our <span style={{ color: '#00EBFF' }}>Traders Say</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Sarah M.', country: 'United States', text: 'Best trading platform I have used. Fast execution and excellent support team!', rating: 5 },
              { name: 'Chen W.',  country: 'Singapore',     text: 'The KYC process was quick and easy. Already made my first profitable trades!', rating: 5 },
              { name: 'Ahmed R.', country: 'UAE',           text: 'Professional platform with top-tier features. Highly recommend for beginners.',  rating: 5 },
            ].map((t, i) => (
              <div key={i} className="p-8 rounded-xl transition-all duration-300" style={{
                background: '#3a3434',
                border: '1px solid rgba(0,235,255,0.1)',
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'rgba(176,224,230,0.35)';
                  e.currentTarget.style.boxShadow = '0 0 32px rgba(176,224,230,0.05)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'rgba(0,235,255,0.1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div className="flex mb-4">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="mb-6 leading-relaxed text-sm" style={{ color: '#C0B8B8' }}>"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm" style={{ background: '#00EBFF22', color: '#00EBFF' }}>{t.name[0]}</div>
                  <div>
                    <div className="font-semibold text-sm" style={{ color: '#F5F5F0' }}>{t.name}</div>
                    <div className="text-xs" style={{ color: '#A0B0C0' }}>{t.country}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ─────────────────────────────────────────────────────────────── */}
      <section className="py-24 px-6" style={{ background: '#3a3434' }}>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: '#F5F5F0', letterSpacing: '-0.02em' }}>FAQ</h2>
            <p style={{ color: '#C0B8B8' }}>Everything you need to know about Vantix Trading</p>
          </div>
          <div className="space-y-3">
            {[
              { q: 'What is the minimum deposit?',         a: 'The minimum deposit is 100 USDT across all supported networks.' },
              { q: 'How long does KYC verification take?', a: 'KYC verification typically takes 3–6 hours after submission.' },
              { q: 'What cryptocurrencies can I trade?',   a: 'You can trade Bitcoin, Ethereum, USDC, USDT, XRP, and Solana.' },
              { q: 'How do I withdraw my funds?',          a: 'Navigate to Withdraw, enter your wallet address and amount, then wait for admin approval.' },
              { q: 'Are there any trading fees?',          a: 'No trading fees. Profits and losses are based on the trade outcome percentages.' },
            ].map((item, i) => (
              <details key={i} className="rounded-xl overflow-hidden group" style={{ border: '1px solid rgba(0,235,255,0.12)' }}>
                <summary className="flex items-center justify-between px-6 py-5 cursor-pointer text-sm font-semibold transition-colors" style={{ color: '#F5F5F0', background: 'rgba(8,8,8,0.4)', listStyle: 'none' }}>
                  <span>{item.q}</span>
                  <ChevronRight className="w-4 h-4 flex-shrink-0 transition-transform group-open:rotate-90" style={{ color: '#00EBFF' }} />
                </summary>
                <div className="px-6 py-4 text-sm leading-relaxed" style={{ color: '#C0B8B8', background: 'rgba(0,235,255,0.02)', borderTop: '1px solid rgba(0,235,255,0.08)' }}>
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA BANNER ──────────────────────────────────────────────────────── */}
      <section className="py-28 px-6 relative overflow-hidden" style={{ background: '#080808' }}>
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 70% 50% at 50% 50%, rgba(0,235,255,0.06) 0%, transparent 70%)',
        }} />
        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, #FFC0CB44, #E6E6FA66, #B0E0E699, #E6E6FA66, #FFC0CB44, transparent)', marginBottom: 80 }} />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-5" style={{ color: '#F5F5F0', letterSpacing: '-0.02em' }}>
            Ready to Start Trading?
          </h2>
          <p className="text-lg mb-10" style={{ color: '#C0B8B8', maxWidth: 500, margin: '0 auto 40px' }}>
            Join thousands of traders worldwide and start earning with Vantix
          </p>
          <button
            onClick={() => onNavigate('login')}
            className="inline-flex items-center gap-2 px-10 py-5 rounded-xl font-bold text-lg transition-all duration-300"
            style={{
              background: '#00EBFF',
              color: '#080808',
              boxShadow: '0 0 48px rgba(0,235,255,0.4)',
            }}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 0 72px rgba(0,235,255,0.6)')}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 0 48px rgba(0,235,255,0.4)')}
          >
            Create Free Account <ArrowRight className="w-5 h-5" />
          </button>
          <div className="flex items-center justify-center gap-8 mt-10">
            {[
              { icon: Lock,  l: 'Secure & Safe' },
              { icon: Coins, l: 'Low Fees'       },
              { icon: Globe, l: 'Global Access'  },
              { icon: Award, l: 'Licensed'        },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <item.icon className="w-5 h-5" style={{ color: '#00EBFF' }} />
                <span className="text-xs" style={{ color: '#A0B0C0' }}>{item.l}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, #FFC0CB44, #E6E6FA66, #B0E0E699, #E6E6FA66, #FFC0CB44, transparent)', marginTop: 80 }} />
      </section>

      {/* ─── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer className="py-14 px-6" style={{ background: '#3a3434', borderTop: '1px solid rgba(0,235,255,0.1)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <img src="https://i.imgur.com/oJYd0t6.png" alt="Vantix" className="h-8 w-auto object-contain" style={{ filter: 'drop-shadow(0 0 6px rgba(0,235,255,0.4))' }} />
                <span className="font-bold tracking-wide" style={{ color: '#00EBFF' }}>Vantix Trading</span>
              </div>
              <p className="text-xs max-w-xs leading-relaxed" style={{ color: '#A0B0C0' }}>
                Your innovative platform for comprehensive trading and decentralized assets.
              </p>
            </div>
            <div className="flex flex-wrap gap-6 text-sm" style={{ color: '#C0B8B8' }}>
              {['Exchange', 'About Us', 'Support', 'Legal', 'Privacy Policy', 'Terms of Service'].map(l => (
                <span key={l} className="cursor-pointer transition-colors hover:text-[#00EBFF]">{l}</span>
              ))}
            </div>
          </div>
          <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, #FFC0CB33, #E6E6FA44, #B0E0E666, transparent)', marginBottom: 20 }} />
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs" style={{ color: '#8899AA' }}>© 2026 Vantix Trading. All rights reserved.</p>
            <p className="text-xs text-center md:text-right max-w-lg leading-relaxed" style={{ color: '#7A8899' }}>
              Trading cryptocurrencies involves significant risk and may not be suitable for all investors. Vantix Trading does not provide financial, investment or legal advice. Trade responsibly.
            </p>
          </div>
          <div className="flex justify-end mt-4">
            <div style={{ width: 20, height: 20, background: 'radial-gradient(circle, rgba(255,192,203,0.7) 0%, rgba(230,230,250,0.4) 40%, transparent 70%)', filter: 'blur(3px)', borderRadius: '50%' }} />
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes orbFloat {
          0%, 100% { transform: translateY(0) scale(1) rotate(0deg); }
          33%       { transform: translateY(-30px) scale(1.05) rotate(3deg); }
          66%       { transform: translateY(20px) scale(0.97) rotate(-2deg); }
        }
        @keyframes appFloat {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-14px); }
        }
        details summary::-webkit-details-marker { display: none; }
      `}</style>
    </div>
  );
}
