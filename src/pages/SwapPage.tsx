import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { supabase } from '../lib/supabase';
import { ArrowDownUp } from 'lucide-react';

export default function SwapPage() {
  const { profile, refreshProfile } = useAuth();
  const { t } = useLanguage();
  const { formatAmount } = useCurrency();
  const [fromCurrency, setFromCurrency] = useState('BTC');
  const [toCurrency, setToCurrency] = useState('USDT');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const currencies = ['BTC', 'ETH', 'USDC', 'USDT', 'XRP', 'SOL'];

  const exchangeRates: { [key: string]: number } = {
    BTC: 43000,
    ETH: 2300,
    USDC: 1,
    USDT: 1,
    XRP: 0.6,
    SOL: 100,
  };

  const getBalance = (curr: string) => {
    if (!profile) return 0;
    switch (curr) {
      case 'BTC': return profile.btc_balance;
      case 'ETH': return profile.eth_balance;
      case 'USDC': return profile.usdc_balance;
      case 'USDT': return profile.usdt_balance;
      case 'XRP': return profile.xrp_balance;
      case 'SOL': return profile.sol_balance;
      default: return 0;
    }
  };

  const calculateSwap = () => {
    if (!amount) return 0;
    const numAmount = parseFloat(amount);
    const fromRate = exchangeRates[fromCurrency];
    const toRate = exchangeRates[toCurrency];
    return (numAmount * fromRate) / toRate;
  };

  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    const numAmount = parseFloat(amount);
    const fromBalance = getBalance(fromCurrency);

    if (numAmount <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    if (numAmount > fromBalance) {
      setError(`Insufficient ${fromCurrency} balance`);
      return;
    }

    if (fromCurrency === toCurrency) {
      setError('Cannot swap same currency');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const toAmount = calculateSwap();
      const fromBalanceField = `${fromCurrency.toLowerCase()}_balance`;
      const toBalanceField = `${toCurrency.toLowerCase()}_balance`;

      const newFromBalance = fromBalance - numAmount;
      const newToBalance = getBalance(toCurrency) + toAmount;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          [fromBalanceField]: newFromBalance,
          [toBalanceField]: newToBalance,
        })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      await supabase.from('transactions').insert({
        user_id: profile.id,
        type: 'swap',
        amount: numAmount,
        currency: fromCurrency,
        status: 'completed',
        details: {
          from: fromCurrency,
          to: toCurrency,
          fromAmount: numAmount,
          toAmount,
        },
      });

      setSuccess(true);
      setAmount('');
      await refreshProfile();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to swap');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] py-8 px-4 pb-20">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">{t('swap')}</h1>

        <div className="bg-[#0f0f0f] rounded-lg p-6 border border-teal-900/30">
          <h2 className="text-xl font-semibold text-white mb-6">Swap Cryptocurrencies</h2>

          {success && (
            <div className="mb-6 bg-green-900/50 border border-green-600 text-green-200 px-4 py-3 rounded-md text-sm">
              Swap completed successfully!
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-[#1a1a1a] rounded-lg p-6 border border-teal-900/30">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                From
              </label>
              <select
                value={fromCurrency}
                onChange={(e) => setFromCurrency(e.target.value)}
                className="w-full px-4 py-3 bg-[#0f0f0f] border border-teal-900/30 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-teal-600 mb-3"
              >
                {currencies.map((curr) => (
                  <option key={curr} value={curr}>
                    {curr}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                step="0.00000001"
                min="0"
                className="w-full px-4 py-3 bg-[#0f0f0f] border border-teal-900/30 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-600"
                placeholder="0.00"
              />
              <div className="mt-2 text-sm text-gray-400">
                Available: {getBalance(fromCurrency).toFixed(8)} {fromCurrency}
              </div>
              <div className="text-sm text-gray-400">
                {formatAmount(getBalance(fromCurrency))}
              </div>
            </div>

            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleSwap}
                className="bg-teal-600 p-3 rounded-full hover:bg-teal-700 transition-colors"
              >
                <ArrowDownUp className="w-6 h-6 text-white" />
              </button>
            </div>

            <div className="bg-[#1a1a1a] rounded-lg p-6 border border-teal-900/30">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                To
              </label>
              <select
                value={toCurrency}
                onChange={(e) => setToCurrency(e.target.value)}
                className="w-full px-4 py-3 bg-[#0f0f0f] border border-teal-900/30 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-teal-600 mb-3"
              >
                {currencies.map((curr) => (
                  <option key={curr} value={curr}>
                    {curr}
                  </option>
                ))}
              </select>
              <div className="w-full px-4 py-3 bg-[#0f0f0f] border border-teal-900/30 rounded-md text-white">
                {calculateSwap().toFixed(8)}
              </div>
              <div className="mt-2 text-sm text-gray-400">
                Available: {getBalance(toCurrency).toFixed(8)} {toCurrency}
              </div>
              <div className="text-sm text-gray-400">
                {formatAmount(getBalance(toCurrency))}
              </div>
            </div>

            <div className="bg-[#1a1a1a] rounded-lg p-4 border border-teal-900/30">
              <div className="text-sm text-gray-400 mb-2">Exchange Rate</div>
              <div className="text-white font-semibold">
                1 {fromCurrency} = {(exchangeRates[fromCurrency] / exchangeRates[toCurrency]).toFixed(8)} {toCurrency}
              </div>
            </div>

            {error && (
              <div className="bg-red-900/50 border border-red-600 text-red-200 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !amount || parseFloat(amount) <= 0}
              className="w-full bg-teal-600 text-white py-3 rounded-lg font-semibold hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Swapping...' : 'Swap Now'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
