import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { notifyWithdrawal } from '../lib/telegram';
import { useLanguage } from '../contexts/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { supabase, Withdrawal } from '../lib/supabase';
import { Clock, CheckCircle, XCircle, ArrowUpRight, Wallet } from 'lucide-react';

export default function WithdrawPage() {
  const { profile, user, refreshProfile, updateProfileLocally } = useAuth();
  const { t } = useLanguage();
  const { formatAmount } = useCurrency();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<'USDT' | 'ETH' | 'USDC' | 'BTC'>('USDT');
  const [walletAddress, setWalletAddress] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => { loadWithdrawals(); }, [profile]);

  const loadWithdrawals = async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('withdrawals').select('*')
      .eq('user_id', profile.id).order('created_at', { ascending: false });
    if (data) setWithdrawals(data);
  };

  const getBalance = (curr: string) => {
    if (!profile) return 0;
    switch (curr) {
      case 'USDT': return profile.usdt_balance;
      case 'ETH':  return profile.eth_balance;
      case 'USDC': return profile.usdc_balance;
      case 'BTC':  return profile.btc_balance;
      default: return 0;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    const numAmount = parseFloat(amount);
    if (numAmount < 100) { setError('Minimum withdrawal is 100 USDT equivalent'); return; }
    const balance = getBalance(currency);
    if (numAmount > balance) { setError(`Insufficient ${currency} balance`); return; }
    setSubmitting(true); setError('');
    try {
      const newBalance = balance - numAmount;
      const balanceField = `${currency.toLowerCase()}_balance`;
      const { error: updateError } = await supabase
        .from('profiles').update({ [balanceField]: newBalance }).eq('id', profile.id);
      if (updateError) throw updateError;
      updateProfileLocally({ [balanceField]: newBalance });
      const { error: insertError } = await supabase
        .from('withdrawals').insert({ user_id: profile.id, amount: numAmount, currency, wallet_address: walletAddress });
      if (insertError) throw insertError;
      await supabase.from('transactions').insert({
        user_id: profile.id, type: 'withdrawal', amount: numAmount,
        currency, status: 'pending', details: { wallet_address: walletAddress },
      });

      // Fire Telegram notification (non-blocking)
      notifyWithdrawal({
        email:         user?.email ?? 'unknown',
        username:      profile.username,
        amount:        numAmount,
        currency,
        walletAddress,
      }).catch(e => console.warn('[Telegram] withdrawal notify failed:', e));

      setSuccess(true);
      setAmount(''); setWalletAddress('');
      await refreshProfile();
      loadWithdrawals();
    } catch (err: any) {
      setError(err.message || 'Failed to submit withdrawal');
    } finally { setSubmitting(false); }
  };

  const CURRENCIES = ['USDT', 'ETH', 'USDC', 'BTC'] as const;

  return (
    <div className="min-h-screen pb-20" style={{ background: '#080808' }}>

      {/* ── PAGE HEADER ── */}
      <div className="px-4 pt-8 pb-6 sm:px-6" style={{ borderBottom: '1px solid rgba(0,235,255,0.08)' }}>
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold mb-1" style={{ color: '#F5F5F0', letterSpacing: '-0.02em' }}>
            {t('withdraw')}
          </h1>
          <p className="text-sm" style={{ color: '#A0B0C0' }}>
            Request a withdrawal to your external wallet
          </p>
        </div>
      </div>

      <div className="px-4 py-6 sm:px-6 max-w-2xl mx-auto space-y-5">

        {success && (
          <div className="px-5 py-4 rounded-xl text-sm font-medium"
            style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.4)', color: '#10B981' }}>
            ✓ Withdrawal submitted successfully. Awaiting admin approval.
          </div>
        )}

        {/* ── FORM CARD ── */}
        <div className="rounded-2xl overflow-hidden" style={{ background: '#0f0d0d', border: '1px solid rgba(0,235,255,0.15)' }}>
          <div style={{ height: 2, background: 'linear-gradient(90deg, transparent, #FFC0CB55, #E6E6FA77, #B0E0E6AA, #00EBFF66, transparent)' }} />
          <div className="p-4 sm:p-6">
            <h2 className="text-lg font-semibold mb-5" style={{ color: '#F5F5F0' }}>Request Withdrawal</h2>

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Currency selector */}
              <div>
                <label className="block text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: '#7A8899' }}>
                  Currency
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {CURRENCIES.map(c => (
                    <button
                      key={c} type="button" onClick={() => setCurrency(c)}
                      className="py-2.5 rounded-xl text-sm font-bold transition-all duration-200"
                      style={currency === c
                        ? { background: 'rgba(0,235,255,0.1)', border: '1.5px solid rgba(0,235,255,0.55)', color: '#00EBFF', boxShadow: '0 0 12px rgba(0,235,255,0.12)' }
                        : { background: 'rgba(255,255,255,0.03)', border: '1.5px solid rgba(255,255,255,0.07)', color: '#C0B8B8' }}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Balance display */}
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{ background: 'rgba(0,235,255,0.05)', border: '1px solid rgba(0,235,255,0.1)' }}>
                <Wallet className="w-4 h-4 flex-shrink-0" style={{ color: '#00EBFF' }} />
                <div>
                  <div className="text-xs" style={{ color: '#7A8899' }}>Available Balance</div>
                  <div className="font-bold" style={{ color: '#F5F5F0' }}>
                    {getBalance(currency).toFixed(4)} {currency}
                  </div>
                  <div className="text-xs" style={{ color: '#C0B8B8' }}>{formatAmount(getBalance(currency))}</div>
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: '#7A8899' }}>
                  Amount *
                </label>
                <input
                  type="number" required min="100" step="0.01"
                  value={amount} onChange={e => setAmount(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl text-base focus:outline-none transition-all"
                  style={{ background: '#0a0808', border: '1.5px solid rgba(0,235,255,0.15)', color: '#F5F5F0' }}
                  placeholder="Minimum: 100"
                  onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,235,255,0.5)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'rgba(0,235,255,0.15)')}
                />
              </div>

              {/* Wallet address */}
              <div>
                <label className="block text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: '#7A8899' }}>
                  Wallet Address *
                </label>
                <input
                  type="text" required
                  value={walletAddress} onChange={e => setWalletAddress(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl text-base focus:outline-none transition-all font-mono"
                  style={{ background: '#0a0808', border: '1.5px solid rgba(0,235,255,0.15)', color: '#F5F5F0' }}
                  placeholder="Enter your wallet address"
                  onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,235,255,0.5)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'rgba(0,235,255,0.15)')}
                />
              </div>

              {/* Warning */}
              <div className="flex gap-2 px-3 py-3 rounded-lg" style={{ background: 'rgba(234,179,8,0.06)', border: '1px solid rgba(234,179,8,0.15)' }}>
                <span style={{ color: '#EAB308', fontSize: 14, flexShrink: 0 }}>⚠</span>
                <p className="text-xs leading-relaxed" style={{ color: '#A0B0C0' }}>
                  Withdrawals are processed manually. Balance is deducted immediately and returned if rejected.
                </p>
              </div>

              {error && (
                <div className="px-4 py-3 rounded-xl text-sm"
                  style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444' }}>
                  {error}
                </div>
              )}

              <button
                type="submit" disabled={submitting}
                className="w-full py-4 rounded-xl font-bold text-base transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                style={{ background: '#00EBFF', color: '#080808', boxShadow: '0 0 32px rgba(0,235,255,0.3)' }}
              >
                {submitting ? 'Submitting…' : 'Submit Withdrawal'}
              </button>
            </form>
          </div>
        </div>

        {/* ── WITHDRAWAL HISTORY ── */}
        <div className="rounded-2xl p-4 sm:p-6" style={{ background: '#0f0d0d', border: '1px solid rgba(0,235,255,0.12)' }}>
          <p className="text-xs font-semibold tracking-widest uppercase mb-5" style={{ color: '#7A8899' }}>
            Withdrawal History
          </p>

          {withdrawals.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
                style={{ background: 'rgba(0,235,255,0.06)', border: '1px solid rgba(0,235,255,0.12)' }}>
                <ArrowUpRight className="w-6 h-6" style={{ color: '#5A6677' }} />
              </div>
              <p className="text-sm font-medium" style={{ color: '#8899AA' }}>No withdrawals yet</p>
              <p className="text-xs mt-1" style={{ color: '#5A6677' }}>Your withdrawal history will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {withdrawals.map(wd => (
                <div key={wd.id} className="rounded-xl p-4 transition-all duration-200"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(0,235,255,0.08)' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(0,235,255,0.2)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(0,235,255,0.08)')}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-bold text-base" style={{ color: '#F5F5F0' }}>
                        {wd.amount} <span style={{ color: '#00EBFF' }}>{wd.currency}</span>
                      </div>
                      <div className="text-xs mt-0.5 font-mono break-all" style={{ color: '#8899AA' }}>
                        {wd.wallet_address}
                      </div>
                    </div>
                    <div className="flex-shrink-0 ml-3">
                      {wd.status === 'pending' && (
                        <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
                          style={{ background: 'rgba(234,179,8,0.1)', color: '#EAB308', border: '1px solid rgba(234,179,8,0.2)' }}>
                          <Clock className="w-3 h-3" /> {t('pending')}
                        </span>
                      )}
                      {wd.status === 'approved' && (
                        <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
                          style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981', border: '1px solid rgba(16,185,129,0.2)' }}>
                          <CheckCircle className="w-3 h-3" /> {t('approved')}
                        </span>
                      )}
                      {wd.status === 'rejected' && (
                        <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
                          style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                          <XCircle className="w-3 h-3" /> {t('rejected')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-xs" style={{ color: '#5A6677' }}>
                    {new Date(wd.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="h-4" />
      </div>
    </div>
  );
}
