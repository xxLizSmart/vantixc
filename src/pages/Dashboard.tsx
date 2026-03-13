import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useCryptoPrices } from '../contexts/CryptoPriceContext';
import { supabase, Transaction } from '../lib/supabase';
import {
  TrendingUp, ArrowUpRight, ArrowDownRight, Wallet,
  Sparkles, ShieldCheck, Clock, XCircle, Settings, User,
} from 'lucide-react';
import TradingStats from '../components/TradingStats';
import CryptoIcon from '../components/CryptoIcon';

interface DashboardProps {
  onNavigate: (page: string) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const { profile, user } = useAuth();
  const { t } = useLanguage();
  const { getPrice } = useCryptoPrices();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [txLoading, setTxLoading] = useState(false);
  const fetchedForRef = useRef<string | null>(null);

  const fetchTransactions = async (userId: string) => {
    setTxLoading(true);
    try {
      const { data, error } = await supabase
        .from('transactions').select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }).limit(10);
      if (error) console.error('Transactions fetch error:', error.message);
      if (data) setTransactions(data);
    } catch (err) {
      console.error('Dashboard fetchTransactions error:', err);
    } finally {
      setTxLoading(false);
    }
  };

  // Fetch on mount + subscribe to realtime changes so trade results
  // (pending → win/loss) appear instantly without a page reload.
  useEffect(() => {
    const id = profile?.id;
    if (!id) return;

    // Initial fetch (once per user id)
    if (fetchedForRef.current !== id) {
      fetchedForRef.current = id;
      fetchTransactions(id);
    }

    // Realtime: re-fetch whenever any transaction row for this user changes
    const channel = supabase
      .channel(`transactions_${id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${id}` },
        () => fetchTransactions(id)
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  const cryptoAssets = [
    { symbol: 'BTC',  name: 'Bitcoin',   balance: profile?.btc_balance  || 0 },
    { symbol: 'ETH',  name: 'Ethereum',  balance: profile?.eth_balance  || 0 },
    { symbol: 'USDC', name: 'USD Coin',  balance: profile?.usdc_balance || 0 },
    { symbol: 'USDT', name: 'Tether',    balance: profile?.usdt_balance || 0 },
    { symbol: 'XRP',  name: 'Ripple',    balance: profile?.xrp_balance  || 0 },
    { symbol: 'SOL',  name: 'Solana',    balance: profile?.sol_balance  || 0 },
  ];

  // Total portfolio value in USD using live Supabase crypto prices
  const totalAssets = cryptoAssets.reduce((sum, a) => sum + a.balance * getPrice(a.symbol), 0);

  const formatUSD = (amount: number) =>
    `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="min-h-screen py-4 sm:py-6 px-3 sm:px-4 pb-20" style={{ background: '#080808' }}>
      <div className="max-w-7xl mx-auto">

        {/* ── Profile Header ── */}
        <div className="mb-6 rounded-2xl p-5" style={{ background: '#1a1414', border: '1px solid rgba(0,235,255,0.12)' }}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button onClick={() => onNavigate('profile')} className="relative flex-shrink-0 group">
                <div className="w-14 h-14 rounded-full overflow-hidden transition-all group-hover:scale-105"
                  style={{ border: '2px solid rgba(0,235,255,0.4)', boxShadow: '0 0 14px rgba(0,235,255,0.15)' }}>
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ background: '#2e2929' }}>
                      <User className="w-7 h-7" style={{ color: '#554e4e' }} />
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2"
                  style={{ background: '#080808', borderColor: '#080808' }}>
                  <div className="w-2.5 h-2.5 rounded-full m-auto" style={{ background: '#4ADE80', marginTop: 1 }} />
                </div>
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold" style={{ color: '#F5F5F0' }}>
                    {profile?.username || user?.email?.split('@')[0] || 'Trader'}
                  </span>
                  <Sparkles className="w-4 h-4 text-[#00EBFF] animate-pulse" />
                </div>
                <p className="text-sm" style={{ color: '#C0B8B8' }}>Welcome back</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {profile?.kyc_status === 'verified' && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                  style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)' }}>
                  <ShieldCheck className="w-4 h-4" style={{ color: '#4ADE80' }} />
                  <span className="text-xs font-bold" style={{ color: '#4ADE80' }}>VERIFIED</span>
                </div>
              )}
              {profile?.kyc_status === 'pending' && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                  style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)' }}>
                  <Clock className="w-4 h-4 animate-pulse" style={{ color: '#FBbf24' }} />
                  <span className="text-xs font-bold" style={{ color: '#FBbf24' }}>KYC PENDING</span>
                </div>
              )}
              {profile?.kyc_status === 'not_verified' && (
                <button onClick={() => onNavigate('kyc')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all hover:scale-105"
                  style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
                  <XCircle className="w-4 h-4" style={{ color: '#EF4444' }} />
                  <span className="text-xs font-bold" style={{ color: '#EF4444' }}>VERIFY KYC</span>
                </button>
              )}
              <button onClick={() => onNavigate('profile')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:scale-105"
                style={{ background: 'rgba(0,235,255,0.08)', border: '1px solid rgba(0,235,255,0.2)', color: '#00EBFF' }}>
                Edit Profile
              </button>
            </div>
          </div>
        </div>

        {/* ── Trading Stats ── */}
        <div className="mb-6">
          <TradingStats />
        </div>

        {/* ── Quick Actions ── */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 ${profile?.is_admin ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-4 mb-6`}>
          {/* Total Assets */}
          <div className="rounded-2xl p-5" style={{ background: '#0f0d0d', border: '1px solid rgba(0,235,255,0.12)' }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium" style={{ color: '#C0B8B8' }}>{t('totalAssets')}</span>
              <Wallet className="w-4 h-4" style={{ color: '#00EBFF' }} />
            </div>
            <div className="text-2xl font-bold mb-1" style={{ color: '#F5F5F0' }}>
              {formatUSD(totalAssets)}
            </div>
            <div className="flex items-center gap-1 text-xs" style={{ color: '#4ADE80' }}>
              <TrendingUp className="w-3 h-3" /> Portfolio Value
            </div>
          </div>

          {/* Deposit */}
          <button onClick={() => onNavigate('deposit')}
            className="rounded-2xl p-5 text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))', border: '1px solid rgba(16,185,129,0.35)' }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-base font-bold" style={{ color: '#F5F5F0' }}>{t('deposit')}</span>
              <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.2)' }}>
                <ArrowDownRight className="w-5 h-5" style={{ color: '#10B981' }} />
              </div>
            </div>
            <p className="text-sm" style={{ color: 'rgba(16,185,129,0.7)' }}>Add funds to your account</p>
          </button>

          {/* Withdraw */}
          <button onClick={() => onNavigate('withdraw')}
            className="rounded-2xl p-5 text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.05))', border: '1px solid rgba(239,68,68,0.35)' }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-base font-bold" style={{ color: '#F5F5F0' }}>{t('withdraw')}</span>
              <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.2)' }}>
                <ArrowUpRight className="w-5 h-5" style={{ color: '#EF4444' }} />
              </div>
            </div>
            <p className="text-sm" style={{ color: 'rgba(239,68,68,0.7)' }}>Withdraw your earnings</p>
          </button>

          {/* Admin (conditional) */}
          {profile?.is_admin && (
            <button onClick={() => onNavigate('admin')}
              className="rounded-2xl p-5 text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, rgba(255,179,71,0.15), rgba(255,179,71,0.05))', border: '1px solid rgba(255,179,71,0.35)' }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-base font-bold" style={{ color: '#F5F5F0' }}>{t('admin')}</span>
                <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,179,71,0.2)' }}>
                  <Settings className="w-5 h-5" style={{ color: '#FFB347' }} />
                </div>
              </div>
              <p className="text-sm" style={{ color: 'rgba(255,179,71,0.7)' }}>Manage platform settings</p>
            </button>
          )}
        </div>

        {/* ── Assets + Transactions ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">

          {/* Your Assets */}
          <div className="rounded-2xl p-5" style={{ background: '#0f0d0d', border: '1px solid rgba(0,235,255,0.12)' }}>
            <h3 className="text-base font-semibold mb-4" style={{ color: '#F5F5F0' }}>Your Assets</h3>
            <div className="space-y-2">
              {cryptoAssets.map(crypto => (
                <div key={crypto.symbol}
                  className="flex items-center justify-between p-3 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(85,78,78,0.3)' }}>
                  <div className="flex items-center gap-3">
                    <CryptoIcon symbol={crypto.symbol} size={36} />
                    <div>
                      <div className="text-sm font-semibold" style={{ color: '#F5F5F0' }}>{crypto.symbol}</div>
                      <div className="text-xs" style={{ color: '#C0B8B8' }}>{crypto.name}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold" style={{ color: '#F5F5F0' }}>{crypto.balance.toFixed(4)}</div>
                    <div className="text-xs" style={{ color: '#C0B8B8' }}>
                      {formatUSD(crypto.balance * getPrice(crypto.symbol))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => onNavigate('trading')}
              className="w-full mt-4 py-3 rounded-xl font-bold text-sm transition-all active:scale-[0.98]"
              style={{ background: '#00EBFF', color: '#080808', boxShadow: '0 0 24px rgba(0,235,255,0.2)' }}>
              {t('trade')} Now
            </button>
          </div>

          {/* Recent Transactions */}
          <div className="rounded-2xl p-5" style={{ background: '#0f0d0d', border: '1px solid rgba(0,235,255,0.12)' }}>
            <h3 className="text-base font-semibold mb-4" style={{ color: '#F5F5F0' }}>{t('recentTransactions')}</h3>
            {txLoading ? (
              <div className="flex items-center justify-center py-10 gap-3">
                <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#00EBFF', borderTopColor: 'transparent' }} />
                <span className="text-sm" style={{ color: '#C0B8B8' }}>Loading…</span>
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-10" style={{ color: '#C0B8B8' }}>
                <div className="text-sm mb-1">No transactions yet</div>
                <div className="text-xs" style={{ color: '#5A6677' }}>Start trading to see your history</div>
              </div>
            ) : (
              <div className="space-y-2">
                {transactions.map(tx => {
                  const isTrade      = tx.type === 'trade';
                  const isDeposit    = tx.type === 'deposit';
                  const isWin        = tx.status === 'win';
                  const isLoss       = tx.status === 'loss';
                  const isPending    = tx.status === 'pending';

                  // Label
                  let label = '';
                  if (isTrade) {
                    if (isPending)   label = 'Trade Initiated';
                    else if (isWin)  label = 'Trade — Win';
                    else if (isLoss) label = 'Trade — Loss';
                    else             label = 'Trade';
                  } else if (isDeposit) {
                    label = 'Deposit';
                  } else {
                    label = tx.type.charAt(0).toUpperCase() + tx.type.slice(1);
                  }

                  // Amount display
                  let amountStr = '';
                  let amountColor = '#00EBFF';
                  if (isTrade) {
                    if (isPending) {
                      amountStr  = formatUSD(tx.amount);
                      amountColor = '#C0B8B8';
                    } else if (isWin) {
                      amountStr  = `+${formatUSD(tx.amount)}`;
                      amountColor = '#4ADE80';
                    } else if (isLoss) {
                      amountStr  = `-${formatUSD(tx.amount)}`;
                      amountColor = '#EF4444';
                    } else {
                      amountStr  = formatUSD(tx.amount);
                    }
                  } else if (isDeposit) {
                    amountStr  = `+${formatUSD(tx.amount)}`;
                    amountColor = '#4ADE80';
                  } else {
                    amountStr  = `-${formatUSD(tx.amount)}`;
                    amountColor = '#EF4444';
                  }

                  // Status badge
                  let statusLabel = '';
                  let statusColor = '#5A6677';
                  if (isTrade) {
                    if (isPending)   { statusLabel = 'Initiated'; statusColor = '#7A8899'; }
                    else if (isWin)  { statusLabel = 'Won';       statusColor = '#4ADE80'; }
                    else if (isLoss) { statusLabel = 'Lost';      statusColor = '#EF4444'; }
                  } else {
                    statusLabel = tx.status.charAt(0).toUpperCase() + tx.status.slice(1);
                    statusColor = tx.status === 'approved' ? '#4ADE80' : tx.status === 'rejected' ? '#EF4444' : '#7A8899';
                  }

                  return (
                    <div key={tx.id}
                      className="flex items-center justify-between p-3 rounded-xl"
                      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(85,78,78,0.3)' }}>
                      <div>
                        <div className="text-sm font-medium" style={{ color: '#F5F5F0' }}>{label}</div>
                        <div className="text-xs mt-0.5" style={{ color: '#5A6677' }}>
                          {new Date(tx.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold" style={{ color: amountColor }}>{amountStr}</div>
                        <div className="text-xs mt-0.5" style={{ color: statusColor }}>{statusLabel}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
