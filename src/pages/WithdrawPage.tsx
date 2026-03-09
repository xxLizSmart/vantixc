import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { supabase, Withdrawal } from '../lib/supabase';
import { Clock, CheckCircle, XCircle } from 'lucide-react';

export default function WithdrawPage() {
  const { profile, refreshProfile } = useAuth();
  const { t } = useLanguage();
  const { formatAmount } = useCurrency();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<'USDT' | 'ETH' | 'USDC' | 'BTC'>('USDT');
  const [walletAddress, setWalletAddress] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadWithdrawals();
  }, [profile]);

  const loadWithdrawals = async () => {
    if (!profile) return;

    const { data } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false });

    if (data) {
      setWithdrawals(data);
    }
  };

  const getBalance = (curr: string) => {
    if (!profile) return 0;
    switch (curr) {
      case 'USDT': return profile.usdt_balance;
      case 'ETH': return profile.eth_balance;
      case 'USDC': return profile.usdc_balance;
      case 'BTC': return profile.btc_balance;
      default: return 0;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    const numAmount = parseFloat(amount);
    if (numAmount < 100) {
      setError('Minimum withdrawal is 100 USDT equivalent');
      return;
    }

    const balance = getBalance(currency);
    if (numAmount > balance) {
      setError(`Insufficient ${currency} balance`);
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const newBalance = balance - numAmount;
      const balanceField = `${currency.toLowerCase()}_balance`;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ [balanceField]: newBalance })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      const { error: insertError } = await supabase
        .from('withdrawals')
        .insert({
          user_id: profile.id,
          amount: numAmount,
          currency,
          wallet_address: walletAddress,
        });

      if (insertError) throw insertError;

      await supabase.from('transactions').insert({
        user_id: profile.id,
        type: 'withdrawal',
        amount: numAmount,
        currency,
        status: 'pending',
        details: { wallet_address: walletAddress },
      });

      setSuccess(true);
      setAmount('');
      setWalletAddress('');
      await refreshProfile();
      loadWithdrawals();
    } catch (err: any) {
      setError(err.message || 'Failed to submit withdrawal');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] py-8 px-4 pb-20">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">{t('withdraw')}</h1>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-[#0f0f0f] rounded-lg p-6 border border-teal-900/30">
            <h2 className="text-xl font-semibold text-white mb-6">Request Withdrawal</h2>

            {success && (
              <div className="mb-6 bg-green-900/50 border border-green-600 text-green-200 px-4 py-3 rounded-md text-sm">
                Withdrawal submitted successfully. Awaiting admin approval.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Currency *
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as any)}
                  className="w-full px-4 py-3 bg-[#1a1a1a] border border-teal-900/30 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-teal-600"
                >
                  <option value="USDT">USDT</option>
                  <option value="ETH">ETH</option>
                  <option value="USDC">USDC</option>
                  <option value="BTC">BTC</option>
                </select>
              </div>

              <div className="bg-[#1a1a1a] rounded-lg p-4 border border-teal-900/30">
                <div className="text-gray-400 text-sm mb-1">Available Balance:</div>
                <div className="text-2xl font-bold text-white">
                  {getBalance(currency).toFixed(4)} {currency}
                </div>
                <div className="text-gray-400 text-sm">
                  {formatAmount(getBalance(currency))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Amount *
                </label>
                <input
                  type="number"
                  required
                  min="100"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-3 bg-[#1a1a1a] border border-teal-900/30 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-600"
                  placeholder="Minimum: 100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Wallet Address *
                </label>
                <input
                  type="text"
                  required
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  className="w-full px-4 py-3 bg-[#1a1a1a] border border-teal-900/30 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-600"
                  placeholder="Enter your wallet address"
                />
              </div>

              {error && (
                <div className="bg-red-900/50 border border-red-600 text-red-200 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-teal-600 text-white py-3 rounded-lg font-semibold hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : t('submit')}
              </button>
            </form>
          </div>

          <div className="bg-[#0f0f0f] rounded-lg p-6 border border-teal-900/30">
            <h2 className="text-xl font-semibold text-white mb-6">Withdrawal History</h2>
            <div className="space-y-4">
              {withdrawals.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  No withdrawals yet
                </div>
              ) : (
                withdrawals.map((withdrawal) => (
                  <div
                    key={withdrawal.id}
                    className="bg-[#1a1a1a] rounded-lg p-4 border border-teal-900/30"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="text-white font-semibold">
                          {withdrawal.amount} {withdrawal.currency}
                        </div>
                        <div className="text-gray-400 text-sm break-all">
                          {withdrawal.wallet_address}
                        </div>
                      </div>
                      <div>
                        {withdrawal.status === 'pending' && (
                          <div className="flex items-center space-x-2 text-yellow-500">
                            <Clock className="w-4 h-4" />
                            <span className="text-sm">{t('pending')}</span>
                          </div>
                        )}
                        {withdrawal.status === 'approved' && (
                          <div className="flex items-center space-x-2 text-green-500">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-sm">{t('approved')}</span>
                          </div>
                        )}
                        {withdrawal.status === 'rejected' && (
                          <div className="flex items-center space-x-2 text-red-500">
                            <XCircle className="w-4 h-4" />
                            <span className="text-sm">{t('rejected')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-gray-400 text-xs">
                      {new Date(withdrawal.created_at).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
