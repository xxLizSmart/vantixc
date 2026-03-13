import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { supabase, Trade } from '../lib/supabase';
import { TrendingUp, TrendingDown, AlertTriangle, Wallet } from 'lucide-react';
import Confetti from '../components/Confetti';
import Notification from '../components/Notification';
import { notifyTrade } from '../lib/telegram';

interface TradingPageProps {
  onNavigate: (page: string) => void;
}

// ─── Trading Pairs ────────────────────────────────────────────────────────────
const TRADING_PAIRS = [
  { label: 'BTC/USDT',  symbol: 'BITSTAMP:BTCUSD',   icon: '₿' },
  { label: 'ETH/USDT',  symbol: 'BITSTAMP:ETHUSD',   icon: 'Ξ' },
  { label: 'BNB/USDT',  symbol: 'BINANCE:BNBUSDT',   icon: 'B' },
  { label: 'XRP/USDT',  symbol: 'BITSTAMP:XRPUSD',   icon: '✕' },
  { label: 'SOL/USDT',  symbol: 'COINBASE:SOLUSD',   icon: '◎' },
  { label: 'ADA/USDT',  symbol: 'BINANCE:ADAUSDT',   icon: 'A' },
  { label: 'DOGE/USDT', symbol: 'BINANCE:DOGEUSDT',  icon: 'Ð' },
  { label: 'LTC/USDT',  symbol: 'BITSTAMP:LTCUSD',   icon: 'Ł' },
  { label: 'DOT/USDT',  symbol: 'BINANCE:DOTUSDT',   icon: '●' },
  { label: 'MATIC/USDT',symbol: 'BINANCE:MATICUSDT', icon: 'M' },
];

// ─── 7 Hardcoded Duration Tiers ──────────────────────────────────────────────
const DURATION_TIERS = [
  { duration: 30,  win: 10, loss: 100, min: 100,     max: 1_000_000 },
  { duration: 60,  win: 12, loss: 100, min: 1_000,   max: 1_000_000 },
  { duration: 90,  win: 15, loss: 100, min: 5_000,   max: 1_000_000 },
  { duration: 120, win: 18, loss: 100, min: 10_000,  max: 1_000_000 },
  { duration: 150, win: 20, loss: 100, min: 30_000,  max: 1_000_000 },
  { duration: 180, win: 25, loss: 100, min: 50_000,  max: 1_000_000 },
  { duration: 210, win: 30, loss: 100, min: 100_000, max: 1_000_000 },
];

// ─── Circular countdown timer ─────────────────────────────────────────────────
function CountdownRing({ timeRemaining, totalDuration }: { timeRemaining: number; totalDuration: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const progress = timeRemaining / totalDuration;
  const dashoffset = circumference * (1 - progress);

  // Iridescent color interpolation as time runs out
  const hue = Math.round(progress * 180); // 180 = cyan, 0 = red
  const strokeColor = progress > 0.4
    ? `hsl(${hue + 170}, 100%, 60%)`
    : progress > 0.2 ? '#F59E0B' : '#EF4444';

  return (
    <div className="relative flex items-center justify-center" style={{ width: 140, height: 140 }}>
      {/* Glow behind ring */}
      <div className="absolute inset-0 rounded-full" style={{
        background: `radial-gradient(circle, ${strokeColor}20 0%, transparent 70%)`,
        filter: 'blur(8px)',
      }} />

      <svg width="140" height="140" viewBox="0 0 140 140" className="absolute inset-0 -rotate-90">
        {/* Track */}
        <circle cx="70" cy="70" r={radius} fill="none" stroke="rgba(0,235,255,0.08)" strokeWidth="8" />
        {/* Iridescent progress */}
        <circle
          cx="70" cy="70" r={radius}
          fill="none"
          stroke="url(#iridGrad)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          style={{ transition: 'stroke-dashoffset 0.9s linear' }}
        />
        <defs>
          <linearGradient id="iridGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#FFC0CB" />
            <stop offset="33%"  stopColor="#E6E6FA" />
            <stop offset="66%"  stopColor="#B0E0E6" />
            <stop offset="100%" stopColor="#00EBFF" />
          </linearGradient>
        </defs>
      </svg>

      {/* Center text */}
      <div className="relative text-center z-10">
        <div className="text-3xl font-bold tabular-nums" style={{ color: strokeColor, textShadow: `0 0 16px ${strokeColor}88` }}>
          {timeRemaining}
        </div>
        <div className="text-xs font-semibold tracking-wider" style={{ color: '#7A8899' }}>SEC</div>
      </div>
    </div>
  );
}

export default function TradingPage({ onNavigate: _onNavigate }: TradingPageProps) {
  const { profile, updateProfileLocally, user } = useAuth();
  const { t } = useLanguage();
  const { formatAmount } = useCurrency();

  const [selectedTierIdx, setSelectedTierIdx]   = useState(0);
  const [amount, setAmount]                      = useState('');
  const [tradeType, setTradeType]                = useState<'BUY' | 'SELL'>('BUY');
  const [showTradeModal, setShowTradeModal]       = useState(false);
  const [currentTrade, setCurrentTrade]          = useState<Trade | null>(null);
  const [timeRemaining, setTimeRemaining]        = useState(0);
  const [error, setError]                        = useState('');
  const [showConfetti, setShowConfetti]          = useState(false);
  const [notification, setNotification]          = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [selectedPair, setSelectedPair]          = useState(TRADING_PAIRS[0]);
  const [chartsLoaded, setChartsLoaded]          = useState(false);
  const mainChartRef    = useRef<HTMLDivElement>(null);
  const modalChartRef   = useRef<HTMLDivElement>(null);
  const pendingTxIdRef  = useRef<string | null>(null);
  const completeTradeRef = useRef<() => Promise<void>>(() => Promise.resolve());

  const tier = DURATION_TIERS[selectedTierIdx];
  const numAmount   = parseFloat(amount) || 0;
  const belowMin    = numAmount > 0 && numAmount < tier.min;
  const aboveMax    = numAmount > tier.max;
  const noBalance   = numAmount > (profile?.usdt_balance || 0);
  const canTrade    = numAmount >= tier.min && !aboveMax && !noBalance && !!amount;

  // ── Chart helpers ─────────────────────────────────────────────────────────────
  const initChart = (container: HTMLDivElement, fullToolbar: boolean, symbol: string) => {
    container.innerHTML = '';
    const div = document.createElement('div');
    div.className = 'tradingview-widget-container__widget';
    div.style.cssText = 'height:100%;width:100%;position:absolute;top:0;left:0;';
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true, symbol, interval: '1',
      timezone: 'Etc/UTC', theme: 'dark', style: '0', locale: 'en',
      allow_symbol_change: fullToolbar, calendar: false, details: false,
      hide_side_toolbar: true, hide_top_toolbar: !fullToolbar,
      backgroundColor: '#080808', gridColor: 'rgba(0,235,255,0.04)',
      studies: ['STD;Bollinger_Bands'], width: '100%', height: '100%',
    });
    container.appendChild(div);
    container.appendChild(script);
  };

  // ── Chart setup — single effect handles both initial load and pair changes ──
  useEffect(() => {
    const existing = document.querySelectorAll('body > script[src*="tradingview.com"]');
    existing.forEach(s => s.remove());
    const timer = setTimeout(() => setChartsLoaded(true), 100);
    return () => {
      clearTimeout(timer);
      document.querySelectorAll('.tradingview-widget-copyright').forEach(w => w.remove());
    };
  }, []);

  // Main chart: re-init whenever chartsLoaded flips true OR pair changes
  useEffect(() => {
    if (!chartsLoaded || !mainChartRef.current) return;
    initChart(mainChartRef.current, true, selectedPair.symbol);
  }, [chartsLoaded, selectedPair]); // eslint-disable-line react-hooks/exhaustive-deps

  // Modal chart: init once when modal opens (new div every time modal mounts)
  useEffect(() => {
    if (!chartsLoaded || !showTradeModal || !modalChartRef.current) return;
    initChart(modalChartRef.current, false, selectedPair.symbol);
  }, [chartsLoaded, showTradeModal]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Countdown ────────────────────────────────────────────────────────────────
  // completeTradeRef is kept current so the countdown effect never has a stale closure
  useEffect(() => { completeTradeRef.current = completeTrade; }); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!currentTrade || timeRemaining <= 0) {
      if (currentTrade && timeRemaining === 0) completeTradeRef.current();
      return;
    }
    const t = setTimeout(() => setTimeRemaining(r => r - 1), 1000);
    return () => clearTimeout(t);
  }, [timeRemaining, currentTrade]);

  // ── Start trade ──────────────────────────────────────────────────────────────
  const startTrade = async () => {
    if (!profile || !canTrade) return;
    setError('');

    const newBalance = profile.usdt_balance - numAmount;
    const { error: balErr } = await supabase
      .from('profiles').update({ usdt_balance: newBalance }).eq('id', profile.id);
    if (balErr) { setError('Failed to start trade'); return; }
    updateProfileLocally({ usdt_balance: newBalance });

    const { data: tradeData, error: tradeErr } = await supabase
      .from('trades').insert({
        user_id: profile.id, trade_type: tradeType,
        amount: numAmount, duration: tier.duration,
        outcome: 'pending', profit_loss: 0,
      }).select().single();
    if (tradeErr || !tradeData) { setError('Failed to create trade'); return; }

    // Insert the pending transaction and capture its ID so completeTrade can
    // UPDATE it (rather than insert a duplicate win/loss transaction).
    const { data: txData } = await supabase
      .from('transactions')
      .insert({
        user_id: profile.id, type: 'trade', amount: numAmount, currency: 'USDT',
        status: 'pending', details: { trade_id: tradeData.id, type: tradeType },
      })
      .select('id')
      .single();
    pendingTxIdRef.current = txData?.id ?? null;

    notifyTrade({
      email:     user?.email ?? 'unknown',
      username:  profile.username,
      amount:    numAmount,
      direction: tradeType,
      duration:  tier.duration,
      pair:      selectedPair.label,
    }).catch(e => console.warn('[Telegram] trade notify failed:', e));

    setCurrentTrade(tradeData);
    setTimeRemaining(tier.duration);
    setShowTradeModal(true);
    setAmount('');
  };

  // ── Complete trade ───────────────────────────────────────────────────────────
  const completeTrade = async () => {
    if (!currentTrade || !profile) return;

    try {
      // ── Read forced_result via SECURITY DEFINER RPC ────────────────────────
      // Value persists until admin explicitly sets it back to RANDOM (null).
      // Falls back gracefully if the RPC hasn't been deployed yet.
      let forced: 'win' | 'loss' | null = null;
      try {
        const { data: rpcData, error: rpcErr } = await supabase
          .rpc('get_forced_result', { p_user_id: profile.id });
        if (!rpcErr) forced = (rpcData as 'win' | 'loss' | null) ?? null;
      } catch { /* RPC not deployed yet — fall through to random */ }

      // Determine outcome: forced overrides random, persists across all trades
      const isWin = forced !== null ? forced === 'win' : Math.random() > 0.5;

      const tierData = DURATION_TIERS.find(td => td.duration === currentTrade.duration) || tier;
      const profitLoss = isWin
        ? (currentTrade.amount * tierData.win) / 100
        : -(currentTrade.amount * tierData.loss) / 100;

      const newBalance = profile.usdt_balance + currentTrade.amount + profitLoss;

      await supabase.from('trades').update({
        outcome: isWin ? 'win' : 'loss',
        profit_loss: profitLoss,
        completed_at: new Date().toISOString(),
      }).eq('id', currentTrade.id);

      await supabase.from('profiles').update({ usdt_balance: newBalance }).eq('id', profile.id);
      updateProfileLocally({ usdt_balance: newBalance });

      // UPDATE the pending transaction to reflect the final result.
      // This avoids duplicate entries in the transaction history.
      if (pendingTxIdRef.current) {
        await supabase
          .from('transactions')
          .update({
            status: isWin ? 'win' : 'loss',
            amount: Math.abs(profitLoss),
            details: { trade_id: currentTrade.id, outcome: isWin ? 'win' : 'loss' },
          })
          .eq('id', pendingTxIdRef.current);
        pendingTxIdRef.current = null;
      } else {
        // Fallback: no ref (e.g. page refreshed mid-trade) — insert fresh record
        await supabase.from('transactions').insert({
          user_id: profile.id, type: 'trade',
          amount: Math.abs(profitLoss), currency: 'USDT',
          status: isWin ? 'win' : 'loss',
          details: { trade_id: currentTrade.id, outcome: isWin ? 'win' : 'loss' },
        });
      }

      if (isWin) {
        setShowConfetti(true);
        setNotification({ message: `🎉 You won $${profitLoss.toFixed(2)}!`, type: 'success' });
      } else {
        setNotification({ message: `Trade closed. Total investment lost: $${Math.abs(profitLoss).toFixed(2)}`, type: 'error' });
      }
    } catch (err) {
      console.error('[completeTrade] error:', err);
      setNotification({ message: 'Trade completed but result could not be saved. Please refresh.', type: 'error' });
    } finally {
      // Always close the modal — even if something errors above
      setShowTradeModal(false);
      setCurrentTrade(null);
    }
  };

  return (
    <div className="min-h-screen pb-20" style={{ background: '#080808' }}>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">

        {/* ── PAGE HEADER ── */}
        <div className="mb-5">
          <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: '#F5F5F0', letterSpacing: '-0.02em' }}>
            {t('trading')}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: '#7A8899' }}>{selectedPair.label} · Live execution</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* ── CHART ── */}
          <div className="lg:col-span-2 rounded-2xl overflow-hidden" style={{ background: '#0f0d0d', border: '1px solid rgba(0,235,255,0.12)' }}>
            <div className="px-5 py-3.5 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(0,235,255,0.08)' }}>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#00EBFF] animate-pulse" />
                <span className="text-sm font-semibold" style={{ color: '#00EBFF' }}>Live Chart</span>
              </div>
              <span className="text-xs" style={{ color: '#7A8899' }}>{selectedPair.label} · 1m</span>
            </div>
            <div className="h-64 sm:h-80 md:h-96 lg:h-[500px] w-full relative" style={{ background: '#080808' }}>
              {!chartsLoaded && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'rgba(0,235,255,0.4)', borderTopColor: 'transparent' }} />
                    <span className="text-xs" style={{ color: '#7A8899' }}>Loading chart…</span>
                  </div>
                </div>
              )}
              <div ref={mainChartRef} className="tradingview-widget-container absolute inset-0 overflow-hidden" />
            </div>
          </div>

          {/* ── TRADE PANEL ── */}
          <div className="rounded-2xl p-4 sm:p-5 flex flex-col gap-4" style={{ background: '#0f0d0d', border: '1px solid rgba(0,235,255,0.12)' }}>

            {/* Balance */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: 'rgba(0,235,255,0.05)', border: '1px solid rgba(0,235,255,0.1)' }}>
              <Wallet className="w-4 h-4 flex-shrink-0" style={{ color: '#00EBFF' }} />
              <div>
                <div className="text-xs" style={{ color: '#7A8899' }}>Available Balance</div>
                <div className="font-bold text-base" style={{ color: '#F5F5F0' }}>
                  {formatAmount(profile?.usdt_balance || 0)}
                </div>
              </div>
            </div>

            {/* ── TRADING PAIR SELECTOR ── */}
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase mb-2.5" style={{ color: '#7A8899' }}>Trading Pair</p>
              <div className="grid grid-cols-5 gap-1.5">
                {TRADING_PAIRS.map(pair => {
                  const active = selectedPair.label === pair.label;
                  return (
                    <button
                      key={pair.label}
                      onClick={() => setSelectedPair(pair)}
                      title={pair.label}
                      className="flex flex-col items-center gap-0.5 py-2 rounded-xl transition-all duration-200"
                      style={{
                        background: active ? 'rgba(0,235,255,0.12)' : 'rgba(255,255,255,0.03)',
                        border: active ? '1.5px solid rgba(0,235,255,0.6)' : '1.5px solid rgba(255,255,255,0.07)',
                        boxShadow: active ? '0 0 14px rgba(0,235,255,0.18)' : 'none',
                      }}
                      onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor = 'rgba(0,235,255,0.3)'; e.currentTarget.style.background = 'rgba(0,235,255,0.05)'; }}}
                      onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}}
                    >
                      <span className="text-sm font-bold leading-none" style={{ color: active ? '#00EBFF' : '#C0B8B8' }}>{pair.icon}</span>
                      <span className="text-[9px] font-semibold leading-none" style={{ color: active ? '#00EBFF' : '#5A6677' }}>
                        {pair.label.split('/')[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
              {/* Active pair label */}
              <div className="mt-2 text-center text-xs font-semibold" style={{ color: '#00EBFF' }}>
                {selectedPair.label}
              </div>
            </div>

            {/* BUY / SELL */}
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase mb-2.5" style={{ color: '#7A8899' }}>Direction</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setTradeType('BUY')}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all duration-200"
                  style={{
                    background: tradeType === 'BUY' ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.03)',
                    border: tradeType === 'BUY' ? '1.5px solid rgba(16,185,129,0.6)' : '1.5px solid rgba(255,255,255,0.07)',
                    color: tradeType === 'BUY' ? '#10B981' : '#7A8899',
                    boxShadow: tradeType === 'BUY' ? '0 0 16px rgba(16,185,129,0.12)' : 'none',
                  }}
                >
                  <TrendingUp className="w-4 h-4" /> BUY / UP
                </button>
                <button
                  onClick={() => setTradeType('SELL')}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all duration-200"
                  style={{
                    background: tradeType === 'SELL' ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.03)',
                    border: tradeType === 'SELL' ? '1.5px solid rgba(239,68,68,0.6)' : '1.5px solid rgba(255,255,255,0.07)',
                    color: tradeType === 'SELL' ? '#EF4444' : '#7A8899',
                    boxShadow: tradeType === 'SELL' ? '0 0 16px rgba(239,68,68,0.12)' : 'none',
                  }}
                >
                  <TrendingDown className="w-4 h-4" /> SELL / DOWN
                </button>
              </div>
            </div>

            {/* ── DURATION PODS ── */}
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase mb-2.5" style={{ color: '#7A8899' }}>Trade Duration</p>
              <div className="grid grid-cols-4 gap-1.5 mb-1.5">
                {DURATION_TIERS.slice(0, 4).map((t, i) => {
                  const active = selectedTierIdx === i;
                  return (
                    <button
                      key={t.duration}
                      onClick={() => { setSelectedTierIdx(i); setError(''); }}
                      className="flex flex-col items-center gap-0.5 py-2.5 rounded-xl transition-all duration-200"
                      style={{
                        background: active ? 'rgba(0,235,255,0.1)' : 'rgba(255,255,255,0.03)',
                        border: active ? '1.5px solid rgba(0,235,255,0.55)' : '1.5px solid rgba(255,255,255,0.07)',
                        boxShadow: active ? '0 0 16px rgba(0,235,255,0.15), inset 0 0 8px rgba(0,235,255,0.04)' : 'none',
                      }}
                      onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor = 'rgba(0,235,255,0.3)'; e.currentTarget.style.background = 'rgba(0,235,255,0.05)'; }}}
                      onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}}
                    >
                      <span className="text-sm font-bold" style={{ color: active ? '#00EBFF' : '#C0B8B8' }}>{t.duration}s</span>
                      <span className="text-xs font-semibold" style={{ color: active ? '#10B981' : '#5A6677' }}>+{t.win}%</span>
                    </button>
                  );
                })}
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {DURATION_TIERS.slice(4).map((t, i) => {
                  const idx = i + 4;
                  const active = selectedTierIdx === idx;
                  return (
                    <button
                      key={t.duration}
                      onClick={() => { setSelectedTierIdx(idx); setError(''); }}
                      className="flex flex-col items-center gap-0.5 py-2.5 rounded-xl transition-all duration-200"
                      style={{
                        background: active ? 'rgba(0,235,255,0.1)' : 'rgba(255,255,255,0.03)',
                        border: active ? '1.5px solid rgba(0,235,255,0.55)' : '1.5px solid rgba(255,255,255,0.07)',
                        boxShadow: active ? '0 0 16px rgba(0,235,255,0.15), inset 0 0 8px rgba(0,235,255,0.04)' : 'none',
                      }}
                      onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor = 'rgba(0,235,255,0.3)'; e.currentTarget.style.background = 'rgba(0,235,255,0.05)'; }}}
                      onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}}
                    >
                      <span className="text-sm font-bold" style={{ color: active ? '#00EBFF' : '#C0B8B8' }}>{t.duration}s</span>
                      <span className="text-xs font-semibold" style={{ color: active ? '#10B981' : '#5A6677' }}>+{t.win}%</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected tier info */}
            <div className="px-4 py-3 rounded-xl" style={{ background: 'rgba(0,235,255,0.04)', border: '1px solid rgba(0,235,255,0.1)' }}>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <div className="font-bold text-sm" style={{ color: '#10B981' }}>+{tier.win}%</div>
                  <div style={{ color: '#7A8899' }}>Win Profit</div>
                </div>
                <div>
                  <div className="font-bold text-sm" style={{ color: '#00EBFF' }}>{tier.duration}s</div>
                  <div style={{ color: '#7A8899' }}>Duration</div>
                </div>
                <div>
                  <div className="font-bold text-sm" style={{ color: '#C0B8B8' }}>${tier.min.toLocaleString()}</div>
                  <div style={{ color: '#7A8899' }}>Min Entry</div>
                </div>
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: '#7A8899' }}>
                Amount (USDT)
              </label>
              <input
                type="number"
                value={amount}
                onChange={e => { setAmount(e.target.value); setError(''); }}
                min={tier.min}
                max={tier.max}
                step="0.01"
                className="w-full px-4 py-3.5 rounded-xl text-base focus:outline-none transition-all"
                style={{
                  background: '#0a0808',
                  border: `1.5px solid ${belowMin || aboveMax || noBalance ? 'rgba(239,68,68,0.5)' : 'rgba(0,235,255,0.15)'}`,
                  color: '#F5F5F0',
                }}
                placeholder={`Min $${tier.min.toLocaleString()}`}
                onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,235,255,0.5)')}
                onBlur={e => (e.currentTarget.style.borderColor = belowMin || noBalance ? 'rgba(239,68,68,0.5)' : 'rgba(0,235,255,0.15)')}
              />

              {/* Validation messages */}
              {belowMin && (
                <p className="mt-2 text-xs font-semibold flex items-center gap-1.5" style={{ color: '#00EBFF' }}>
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                  Minimum entry for this duration is ${tier.min.toLocaleString()}
                </p>
              )}
              {noBalance && !belowMin && (
                <p className="mt-2 text-xs font-semibold flex items-center gap-1.5" style={{ color: '#EF4444' }}>
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                  Insufficient USDT balance
                </p>
              )}
              {aboveMax && (
                <p className="mt-2 text-xs font-semibold flex items-center gap-1.5" style={{ color: '#EF4444' }}>
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                  Maximum entry is $1,000,000
                </p>
              )}
            </div>

            {error && (
              <div className="px-4 py-3 rounded-xl text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444' }}>
                {error}
              </div>
            )}

            {/* Trade button */}
            <button
              onClick={startTrade}
              disabled={!canTrade}
              className="w-full py-4 rounded-xl font-bold text-base transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
              style={{
                background: canTrade
                  ? tradeType === 'BUY' ? 'linear-gradient(90deg, #10B981, #059669)' : 'linear-gradient(90deg, #EF4444, #DC2626)'
                  : '#1a1414',
                color: canTrade ? '#fff' : '#5A6677',
                boxShadow: canTrade
                  ? tradeType === 'BUY' ? '0 0 24px rgba(16,185,129,0.3)' : '0 0 24px rgba(239,68,68,0.3)'
                  : 'none',
                border: canTrade ? 'none' : '1px solid rgba(255,255,255,0.07)',
              }}
              onMouseEnter={e => { if (canTrade) e.currentTarget.style.filter = 'brightness(1.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.filter = ''; }}
            >
              {tradeType === 'BUY' ? '▲' : '▼'} Start Trade · {tier.duration}s
            </button>
          </div>
        </div>
      </div>

      {/* ── TRADE MODAL ── */}
      {showTradeModal && currentTrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(12px)' }}>
          <div className="w-full max-w-2xl rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto" style={{ background: '#0f0d0d', border: '1px solid rgba(0,235,255,0.2)', boxShadow: '0 0 64px rgba(0,235,255,0.1)' }}>
            {/* Modal top stripe */}
            <div style={{ height: 2, background: 'linear-gradient(90deg, transparent, #FFC0CB55, #E6E6FA77, #B0E0E6AA, #00EBFF66, transparent)' }} />

            <div className="p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold" style={{ color: '#F5F5F0' }}>Trade in Progress</h3>
                <span className="text-xs px-3 py-1.5 rounded-full font-semibold" style={{
                  background: currentTrade.trade_type === 'BUY' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                  color: currentTrade.trade_type === 'BUY' ? '#10B981' : '#EF4444',
                  border: `1px solid ${currentTrade.trade_type === 'BUY' ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`,
                }}>
                  {currentTrade.trade_type === 'BUY' ? '▲ BUY / UP' : '▼ SELL / DOWN'}
                </span>
              </div>

              {/* Circular countdown */}
              <div className="flex justify-center mb-6">
                <CountdownRing timeRemaining={timeRemaining} totalDuration={currentTrade.duration} />
              </div>

              {/* Chart */}
              <div className="h-52 sm:h-72 w-full relative rounded-xl overflow-hidden mb-6" style={{ background: '#080808' }}>
                {!chartsLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'rgba(0,235,255,0.4)', borderTopColor: 'transparent' }} />
                  </div>
                )}
                <div ref={modalChartRef} className="tradingview-widget-container absolute inset-0 overflow-hidden" />
              </div>

              {/* Trade details */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { lbl: 'Direction', val: currentTrade.trade_type, color: currentTrade.trade_type === 'BUY' ? '#10B981' : '#EF4444' },
                  { lbl: 'Amount',    val: formatAmount(currentTrade.amount), color: '#F5F5F0' },
                  { lbl: 'Potential', val: `+$${((currentTrade.amount * (DURATION_TIERS.find(t => t.duration === currentTrade.duration)?.win || 10)) / 100).toFixed(2)}`, color: '#00EBFF' },
                ].map((item, i) => (
                  <div key={i} className="p-3 rounded-xl text-center" style={{ background: 'rgba(0,235,255,0.04)', border: '1px solid rgba(0,235,255,0.08)' }}>
                    <div className="text-xs mb-1" style={{ color: '#7A8899' }}>{item.lbl}</div>
                    <div className="font-bold text-sm" style={{ color: item.color }}>{item.val}</div>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </div>
      )}

      <Confetti active={showConfetti} onComplete={() => setShowConfetti(false)} />
      {notification && (
        <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />
      )}
    </div>
  );
}
