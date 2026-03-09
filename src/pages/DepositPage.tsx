import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase, Deposit } from '../lib/supabase';
import { Upload, Clock, CheckCircle, XCircle, Copy, Check } from 'lucide-react';

type NetworkType = 'TRC20' | 'TRC20_ALT' | 'ERC20' | 'ERC20_ALT' | 'BTC' | 'ETH' | 'ETH_ALT';

export default function DepositPage() {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [amount, setAmount] = useState('');
  const [network, setNetwork] = useState<NetworkType>('TRC20');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  const walletData = {
    TRC20: {
      address: 'TFieCTCx9UxXEeB1Bu977jKCurxDxLPXXP',
      qrImage: 'https://horizons-cdn.hostinger.com/34577bfb-cf38-49b4-9bc0-3b2590663564/6e8d624847499925768409fe348ffe79.jpg',
      label: 'TRC20 (USDT)',
    },
    TRC20_ALT: {
      address: 'TYWz3Q8xj6FvSevrfC3YYsdQAAHc6zr5h1',
      qrImage: 'https://i.imgur.com/OU8Xu2Y.png',
      label: 'TRC20 (Alternative)',
    },
    ERC20: {
      address: '0x6fb2603489e0fc38bb90bef6618b44d28b301a1b',
      qrImage: 'https://horizons-cdn.hostinger.com/34577bfb-cf38-49b4-9bc0-3b2590663564/7df3f74d5b0cc4b8f3b096e4ddfb81e4.jpg',
      label: 'ERC20 (USDT)',
    },
    ERC20_ALT: {
      address: '0x0432eb49b1fd13a963e410b3422e16c677ff216f',
      qrImage: 'https://i.imgur.com/qVzZYmu.png',
      label: 'ERC20 (Alternative)',
    },
    BTC: {
      address: 'bc1qwdryv20f84ymsg8qltahfumlyvpkdgk9cv7jma5m9j9a82l3japsfrapqgh',
      qrImage: 'https://horizons-cdn.hostinger.com/34577bfb-cf38-49b4-9bc0-3b2590663564/a89dbe508c7ebaf374c595cfabb338c2.jpg',
      label: 'Bitcoin',
    },
    ETH: {
      address: '0x6fb2603489e0fc38bb90bef6618b44d28b301a1b',
      qrImage: 'https://horizons-cdn.hostinger.com/34577bfb-cf38-49b4-9bc0-3b2590663564/81ea9089aad2799cbfe0bf43e91e6442.jpg',
      label: 'Ethereum',
    },
    ETH_ALT: {
      address: '0x0432eb49b1fd13a963e410b3422e16c677ff216f',
      qrImage: 'https://i.imgur.com/qVzZYmu.png',
      label: 'Ethereum (Alternative)',
    },
  };

  useEffect(() => {
    loadDeposits();
  }, [profile]);

  const loadDeposits = async () => {
    if (!profile) return;

    const { data } = await supabase
      .from('deposits')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false });

    if (data) {
      setDeposits(data);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProofFile(e.target.files[0]);
    }
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !proofFile) {
      setError('Please upload proof of payment');
      return;
    }

    const numAmount = parseFloat(amount);
    if (numAmount < 100) {
      setError('Minimum deposit is 100 USDT');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const proofUrl = await convertToBase64(proofFile);

      // Normalize network type for database
      let dbNetwork = network;
      if (network === 'TRC20_ALT') dbNetwork = 'TRC20';
      else if (network === 'ERC20_ALT') dbNetwork = 'ERC20';
      else if (network === 'ETH_ALT') dbNetwork = 'ETH';

      const { error: insertError } = await supabase
        .from('deposits')
        .insert({
          user_id: profile.id,
          amount: numAmount,
          network: dbNetwork,
          proof_url: proofUrl,
        });

      if (insertError) throw insertError;

      setSuccess(true);
      setAmount('');
      setProofFile(null);
      loadDeposits();
      setTimeout(() => setSuccess(false), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to submit deposit');
    } finally {
      setSubmitting(false);
    }
  };

  const currentWallet = walletData[network];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#1a1a1a] py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-12">Deposit Funds</h1>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-[#0f0f0f] rounded-lg p-8 border border-gray-200 dark:border-teal-900/30 shadow-lg">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-8">Make a Deposit</h2>

            {success && (
              <div className="mb-6 bg-accent/10 border border-accent text-accent px-6 py-4 rounded-lg text-sm">
                Deposit submitted successfully. Awaiting admin approval.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-gray-300 mb-3">
                  Select Network *
                </label>
                <select
                  value={network}
                  onChange={(e) => setNetwork(e.target.value as NetworkType)}
                  className="w-full px-4 py-4 bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-teal-900/30 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                >
                  <option value="TRC20">TRC20 (USDT)</option>
                  <option value="TRC20_ALT">TRC20 (Alternative)</option>
                  <option value="ERC20">ERC20 (USDT)</option>
                  <option value="ERC20_ALT">ERC20 (Alternative)</option>
                  <option value="BTC">Bitcoin (BTC)</option>
                  <option value="ETH">Ethereum (ETH)</option>
                  <option value="ETH_ALT">Ethereum (Alternative)</option>
                </select>
              </div>

              <div className="bg-gray-50 dark:bg-[#1a1a1a] rounded-lg p-8 border border-gray-200 dark:border-teal-900/30">
                <h3 className="text-gray-900 dark:text-white font-semibold mb-6 text-lg">Wallet Address</h3>
                <div className="mb-6">
                  <p className="text-gray-700 dark:text-gray-400 text-sm mb-3">Send your deposit to:</p>
                  <div className="bg-white dark:bg-[#0f0f0f] p-4 rounded-lg border border-gray-200 dark:border-teal-900/30 break-all flex items-center justify-between gap-4">
                    <code className="text-teal-600 dark:text-teal-400 text-sm flex-1">
                      {currentWallet.address}
                    </code>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(currentWallet.address)}
                      className="flex-shrink-0 p-2 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] rounded-lg transition-colors"
                      title="Copy to clipboard"
                    >
                      {copied ? (
                        <Check className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                      ) : (
                        <Copy className="w-5 h-5 text-gray-700 dark:text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-gray-700 dark:text-gray-400 text-sm mb-4">Scan QR Code:</p>
                  <img
                    src={currentWallet.qrImage}
                    alt="QR Code"
                    className="mx-auto w-48 h-48 border-4 border-gray-200 dark:border-teal-900/30 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-gray-300 mb-3">
                  Amount (USDT) *
                </label>
                <input
                  type="number"
                  required
                  min="100"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-4 bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-teal-900/30 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                  placeholder="Minimum: 100 USDT"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-gray-300 mb-3">
                  Upload Proof of Payment *
                </label>
                <div className="border-2 border-dashed border-gray-200 dark:border-teal-900/30 rounded-lg p-8 text-center hover:border-teal-600 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    required
                    className="hidden"
                    id="proof-upload"
                  />
                  <label htmlFor="proof-upload" className="cursor-pointer">
                    <Upload className="w-12 h-12 text-gray-500 dark:text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-700 dark:text-gray-300 font-medium">
                      {proofFile ? proofFile.name : 'Click to upload payment proof'}
                    </p>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">PNG, JPG up to 10MB</p>
                  </label>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-500 dark:border-red-600 text-red-600 dark:text-red-400 px-6 py-4 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-teal-600 dark:bg-teal-600 text-white py-4 rounded-lg font-semibold hover:bg-teal-700 dark:hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {submitting ? 'Submitting...' : 'Submit Deposit'}
              </button>
            </form>
          </div>

          <div className="bg-white dark:bg-[#0f0f0f] rounded-lg p-8 border border-gray-200 dark:border-teal-900/30 shadow-lg">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-8">Deposit History</h2>
            <div className="space-y-4">
              {deposits.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  No deposits yet
                </div>
              ) : (
                deposits.map((deposit) => (
                  <div
                    key={deposit.id}
                    className="bg-gray-50 dark:bg-[#1a1a1a] rounded-lg p-6 border border-gray-200 dark:border-teal-900/30"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="text-gray-900 dark:text-white font-semibold text-lg">
                          {deposit.amount} USDT
                        </div>
                        <div className="text-gray-700 dark:text-gray-400 text-sm">{deposit.network}</div>
                      </div>
                      <div>
                        {deposit.status === 'pending' && (
                          <div className="flex items-center space-x-2 text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 px-3 py-1 rounded-full">
                            <Clock className="w-4 h-4" />
                            <span className="text-sm font-medium">Pending</span>
                          </div>
                        )}
                        {deposit.status === 'approved' && (
                          <div className="flex items-center space-x-2 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-sm font-medium">Approved</span>
                          </div>
                        )}
                        {deposit.status === 'rejected' && (
                          <div className="flex items-center space-x-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-1 rounded-full">
                            <XCircle className="w-4 h-4" />
                            <span className="text-sm font-medium">Rejected</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-gray-500 dark:text-gray-400 text-xs">
                      {new Date(deposit.created_at).toLocaleString()}
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
