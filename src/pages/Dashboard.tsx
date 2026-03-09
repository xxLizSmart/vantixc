import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { supabase, Transaction } from '../lib/supabase';
import { TrendingUp, ArrowUpRight, ArrowDownRight, Wallet, Sparkles, ShieldCheck, Clock, XCircle, Settings } from 'lucide-react';
import TradingStats from '../components/TradingStats';
import Leaderboard from '../components/Leaderboard';

interface DashboardProps {
  onNavigate: (page: string) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const { profile, refreshProfile } = useAuth();
  const { t } = useLanguage();
  const { formatAmount } = useCurrency();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!profile) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      await refreshProfile();

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        setError('Failed to load transactions');
        console.error('Error loading transactions:', error);
      } else if (data) {
        setTransactions(data);
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalAssets = profile
    ? profile.btc_balance +
      profile.eth_balance +
      profile.usdc_balance +
      profile.usdt_balance +
      profile.xrp_balance +
      profile.sol_balance
    : 0;

  const cryptoAssets = [
    { symbol: 'BTC', name: 'Bitcoin', balance: profile?.btc_balance || 0, color: 'text-orange-500' },
    { symbol: 'ETH', name: 'Ethereum', balance: profile?.eth_balance || 0, color: 'text-blue-500' },
    { symbol: 'USDC', name: 'USD Coin', balance: profile?.usdc_balance || 0, color: 'text-blue-400' },
    { symbol: 'USDT', name: 'Tether', balance: profile?.usdt_balance || 0, color: 'text-green-500' },
    { symbol: 'XRP', name: 'Ripple', balance: profile?.xrp_balance || 0, color: 'text-gray-400' },
    { symbol: 'SOL', name: 'Solana', balance: profile?.sol_balance || 0, color: 'text-purple-500' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-white text-xl">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] py-4 sm:py-6 md:py-8 px-3 sm:px-4 pb-20">
      <div className="max-w-7xl mx-auto">
        <div className="mb-4 sm:mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-teal-400 to-teal-600 bg-clip-text text-transparent">
                  {t('dashboard')}
                </h1>
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-teal-400 animate-pulse" />
              </div>
              <p className="text-sm sm:text-base text-gray-400">Welcome back, {profile?.username || 'Trader'}</p>
            </div>

            <div>
              {profile?.kyc_status === 'verified' && (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-900/30 border border-green-500/50 rounded-lg">
                  <ShieldCheck className="w-5 h-5 text-green-400" />
                  <span className="text-green-300 font-semibold text-sm">VERIFIED</span>
                </div>
              )}
              {profile?.kyc_status === 'pending' && (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-900/30 border border-yellow-500/50 rounded-lg">
                  <Clock className="w-5 h-5 text-yellow-400 animate-pulse" />
                  <span className="text-yellow-300 font-semibold text-sm">PENDING</span>
                </div>
              )}
              {profile?.kyc_status === 'not_verified' && (
                <button
                  onClick={() => onNavigate('kyc')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-900/30 border border-red-500/50 rounded-lg hover:bg-red-900/50 transition-all"
                >
                  <XCircle className="w-5 h-5 text-red-400" />
                  <span className="text-red-300 font-semibold text-sm">NOT VERIFIED</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="mb-6 sm:mb-8">
          <TradingStats />
        </div>

        <div className={`grid grid-cols-1 sm:grid-cols-2 ${profile?.is_admin ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-4 md:gap-6 mb-6 sm:mb-8`}>
          <div className="bg-[#0f0f0f] rounded-lg p-6 border border-teal-900/30">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-400 text-sm">{t('totalAssets')}</h3>
              <Wallet className="w-5 h-5 text-teal-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-2">
              {formatAmount(totalAssets)}
            </div>
            <div className="flex items-center text-green-500 text-sm">
              <TrendingUp className="w-4 h-4 mr-1" />
              <span>Portfolio Value</span>
            </div>
          </div>

          <button
            onClick={() => onNavigate('deposit')}
            className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg p-6 border border-green-500 hover:from-green-700 hover:to-green-800 transition-all transform hover:scale-105"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-lg font-semibold">{t('deposit')}</h3>
              <ArrowDownRight className="w-6 h-6 text-white" />
            </div>
            <p className="text-green-200 text-sm">Add funds to your account</p>
          </button>

          <button
            onClick={() => onNavigate('withdraw')}
            className="bg-gradient-to-r from-red-600 to-red-700 rounded-lg p-6 border border-red-500 hover:from-red-700 hover:to-red-800 transition-all transform hover:scale-105"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-lg font-semibold">{t('withdraw')}</h3>
              <ArrowUpRight className="w-6 h-6 text-white" />
            </div>
            <p className="text-red-200 text-sm">Withdraw your earnings</p>
          </button>

          {profile?.is_admin && (
            <button
              onClick={() => onNavigate('admin')}
              className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg p-6 border border-yellow-400 hover:from-yellow-600 hover:to-yellow-700 transition-all transform hover:scale-105"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white text-lg font-semibold">{t('admin')}</h3>
                <Settings className="w-6 h-6 text-white" />
              </div>
              <p className="text-yellow-100 text-sm">Manage platform settings</p>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6 sm:mb-8">
          <div className="bg-[#0f0f0f] rounded-lg p-6 border border-teal-900/30">
            <h3 className="text-xl font-semibold text-white mb-6">Your Assets</h3>
            <div className="space-y-4">
              {cryptoAssets.map((crypto) => (
                <div
                  key={crypto.symbol}
                  className="flex items-center justify-between p-4 bg-[#1a1a1a] rounded-lg border border-teal-900/30"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center ${crypto.color} font-bold`}>
                      {crypto.symbol[0]}
                    </div>
                    <div>
                      <div className="text-white font-semibold">{crypto.symbol}</div>
                      <div className="text-gray-400 text-sm">{crypto.name}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-semibold">{crypto.balance.toFixed(4)}</div>
                    <div className="text-gray-400 text-sm">{formatAmount(crypto.balance)}</div>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => onNavigate('trading')}
              className="w-full mt-6 bg-teal-600 text-white py-3 rounded-lg font-semibold hover:bg-teal-700 transition-colors"
            >
              {t('trade')} Now
            </button>
          </div>

          <div className="bg-[#0f0f0f] rounded-lg p-6 border border-teal-900/30">
            <h3 className="text-xl font-semibold text-white mb-6">{t('recentTransactions')}</h3>
            <div className="space-y-3">
              {transactions.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  No transactions yet. Start trading to see your history.
                </div>
              ) : (
                transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-4 bg-[#1a1a1a] rounded-lg border border-teal-900/30"
                  >
                    <div>
                      <div className="text-white font-medium capitalize">{tx.type}</div>
                      <div className="text-gray-400 text-sm">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-semibold ${
                        tx.type === 'deposit' ? 'text-green-500' :
                        tx.type === 'withdrawal' ? 'text-red-500' :
                        'text-teal-400'
                      }`}>
                        {tx.type === 'deposit' ? '+' : '-'}{formatAmount(tx.amount)}
                      </div>
                      <div className="text-gray-400 text-sm capitalize">{tx.status}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="mt-8">
          <Leaderboard />
        </div>
      </div>
    </div>
  );
}
