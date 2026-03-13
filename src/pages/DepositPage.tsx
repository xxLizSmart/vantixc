import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Deposit } from '../lib/supabase';
import { Upload, Clock, CheckCircle, XCircle, Copy, Check, Sparkles, ZoomIn, Image } from 'lucide-react';
import CryptoIcon from '../components/CryptoIcon';
import { notifyDeposit } from '../lib/telegram';

type NetworkType = 'TRC20' | 'ERC20' | 'ETH' | 'BTC' | 'USDC';

interface WalletConfig {
  address: string;
  qrImage: string;
  label: string;
  sublabel: string;
  symbol: string;
  color: string;
  network: 'TRC20' | 'ERC20' | 'ETH' | 'BTC';
}

const WALLET_DATA: Record<NetworkType, WalletConfig> = {
  TRC20: {
    address:  'TDNn2sakRoJpqAyTi4VNeoU5o2uFnHAvQD',
    qrImage:  'https://i.imgur.com/FdNMXOF.png',
    label:    'USDT', sublabel: 'TRC20 Network',
    symbol:   'USDT', color: '#26A17B', network: 'TRC20',
  },
  ERC20: {
    address:  '0x44d7181d798CA37932AD496383b607B8F17a36F2',
    qrImage:  'https://i.imgur.com/7OShnFK.png',
    label:    'USDT', sublabel: 'ERC20 Network',
    symbol:   'USDT', color: '#26A17B', network: 'ERC20',
  },
  USDC: {
    address:  '0x44d7181d798CA37932AD496383b607B8F17a36F2',
    qrImage:  'https://i.imgur.com/7OShnFK.png',
    label:    'USDC', sublabel: 'Ethereum Network',
    symbol:   'USDC', color: '#2775CA', network: 'ERC20',
  },
  ETH: {
    address:  '0x44d7181d798CA37932AD496383b607B8F17a36F2',
    qrImage:  'https://i.imgur.com/7OShnFK.png',
    label:    'ETH',  sublabel: 'Ethereum Network',
    symbol:   'ETH',  color: '#627EEA', network: 'ETH',
  },
  BTC: {
    address:  'bc1qqu96r4chagapx8g5cqrk6u5g9hg3zsgah99mc0',
    qrImage:  'https://i.imgur.com/n2NkHzJ.png',
    label:    'BTC',  sublabel: 'Bitcoin Network',
    symbol:   'BTC',  color: '#F7931A', network: 'BTC',
  },
};

function Toast({ show, onHide }: { show: boolean; onHide: () => void }) {
  useEffect(() => {
    if (show) { const t = setTimeout(onHide, 3000); return () => clearTimeout(t); }
  }, [show, onHide]);
  if (!show) return null;
  return (
    <div className="fixed bottom-28 left-4 right-4 sm:left-auto sm:right-6 sm:w-auto z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl" style={{
      background: '#1a1414',
      boxShadow: '0 0 0 1px rgba(0,235,255,0.4), 0 8px 32px rgba(0,235,255,0.15)',
    }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: 12, pointerEvents: 'none', background: 'linear-gradient(135deg, rgba(255,192,203,0.12), rgba(230,230,250,0.1), rgba(176,224,230,0.15), rgba(0,235,255,0.1))' }} />
      <Sparkles className="w-4 h-4 flex-shrink-0" style={{ color: '#00EBFF' }} />
      <span className="text-sm font-semibold relative" style={{ color: '#F5F5F0' }}>Address Copied!</span>
      <Check className="w-4 h-4 flex-shrink-0" style={{ color: '#10B981' }} />
    </div>
  );
}

// Convert file to base64 string
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

// Upload file to Supabase Storage, fallback to base64
async function uploadProof(file: File, userId: string): Promise<string> {
  const ext  = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `proofs/${userId}/${Date.now()}.${ext}`;

  try {
    const { error } = await supabase.storage
      .from('deposits')
      .upload(path, file, { upsert: true, contentType: file.type });

    if (!error) {
      const { data } = supabase.storage.from('deposits').getPublicUrl(path);
      return data.publicUrl;
    }
    console.warn('[DepositPage] Storage upload failed, using base64:', error.message);
  } catch (e) {
    console.warn('[DepositPage] Storage upload threw, using base64:', e);
  }

  // Fallback: base64
  return fileToBase64(file);
}

export default function DepositPage() {
  const { profile, user } = useAuth();
  const [deposits, setDeposits]     = useState<Deposit[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [amount, setAmount]         = useState('');
  const [network, setNetwork]       = useState<NetworkType>('TRC20');
  const [proofFile, setProofFile]   = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState(false);
  const [copied, setCopied]         = useState(false);
  const [showToast, setShowToast]   = useState(false);
  const [qrZoomed, setQrZoomed]     = useState(false);
  const [proofZoomed, setProofZoomed] = useState(false);
  const fetchedRef = useRef<string | null>(null);

  const wallet = WALLET_DATA[network];

  // Load deposits once per user — not on every profile object change
  useEffect(() => {
    const id = profile?.id;
    if (!id) return;
    if (fetchedRef.current === id) return;
    fetchedRef.current = id;
    loadDeposits(id);
  }, [profile?.id]);

  const loadDeposits = async (userId: string) => {
    const { data, error: err } = await supabase
      .from('deposits').select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (err) console.error('[DepositPage] loadDeposits:', err.message);
    if (data) setDeposits(data);
  };

  const copyToClipboard = async (text: string) => {
    try { await navigator.clipboard.writeText(text); }
    catch {
      const el = document.createElement('textarea');
      el.value = text; document.body.appendChild(el); el.select();
      document.execCommand('copy'); document.body.removeChild(el);
    }
    setCopied(true); setShowToast(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleProofSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) { setError('Max file size is 15 MB'); return; }
    setError('');
    setProofFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setProofPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (!proofFile) { setError('Please upload proof of payment'); return; }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 100) { setError('Minimum deposit is $100'); return; }

    setSubmitting(true); setError('');
    try {
      // Step 1: Upload proof image (Storage → base64 fallback)
      let proofUrl: string;
      try {
        proofUrl = await uploadProof(proofFile, profile.id);
      } catch {
        // If even base64 fails (file read error), abort early
        throw new Error('Failed to process image. Please try a different file.');
      }

      // Step 2: Insert deposit record — store only a short placeholder if base64 is too large
      const isBase64 = proofUrl.startsWith('data:');
      const urlToStore = isBase64 && proofUrl.length > 500_000
        ? proofUrl.substring(0, 500_000)  // trim if extremely large
        : proofUrl;

      const { error: insertError } = await supabase.from('deposits').insert({
        user_id:   profile.id,
        amount:    numAmount,
        network:   wallet.network,
        proof_url: urlToStore,
        status:    'pending',
      });
      if (insertError) throw new Error(insertError.message);

      // Fire Telegram notification (non-blocking — don't let it fail the submission)
      notifyDeposit({
        email:    user?.email ?? 'unknown',
        username: profile.username,
        amount:   numAmount,
        network:  wallet.network,
        proofUrl: urlToStore,
      }).catch(e => console.warn('[Telegram] deposit notify failed:', e));

      setSuccess(true);
      setAmount('');
      setProofFile(null);
      setProofPreview(null);
      // Reload deposit history
      fetchedRef.current = null;
      await loadDeposits(profile.id);
      fetchedRef.current = profile.id;
      setTimeout(() => setSuccess(false), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to submit deposit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: '#080808' }}>
      <Toast show={showToast} onHide={() => setShowToast(false)} />

      {/* QR zoom overlay */}
      {qrZoomed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6"
          style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(10px)' }}
          onClick={() => setQrZoomed(false)}>
          <div className="rounded-2xl overflow-hidden p-5 text-center" style={{ background: '#1a1414', border: '1px solid rgba(0,235,255,0.3)', boxShadow: '0 0 64px rgba(0,235,255,0.15)' }}>
            <img src={wallet.qrImage} alt="QR Code" className="w-72 h-72 object-contain mx-auto" />
            <p className="text-xs mt-3" style={{ color: '#A0B0C0' }}>Tap anywhere to close</p>
          </div>
        </div>
      )}

      {/* Proof preview zoom overlay */}
      {proofZoomed && proofPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(10px)' }}
          onClick={() => setProofZoomed(false)}>
          <div className="rounded-2xl overflow-hidden p-3" style={{ background: '#1a1414', border: '1px solid rgba(0,235,255,0.3)', maxWidth: '90vw', maxHeight: '80vh' }}>
            <img src={proofPreview} alt="Payment Proof" className="max-w-full max-h-full object-contain rounded-xl" style={{ maxHeight: '70vh' }} />
            <p className="text-xs mt-2 text-center" style={{ color: '#A0B0C0' }}>Tap anywhere to close</p>
          </div>
        </div>
      )}

      {/* PAGE HEADER */}
      <div className="px-4 pt-8 pb-6 sm:px-6" style={{ borderBottom: '1px solid rgba(0,235,255,0.08)' }}>
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold mb-1" style={{ color: '#F5F5F0', letterSpacing: '-0.02em' }}>
            Deposit Funds
          </h1>
          <p className="text-sm" style={{ color: '#A0B0C0' }}>
            Select a network and send to the secure Vantix wallet address
          </p>
        </div>
      </div>

      <div className="px-4 py-6 sm:px-6 max-w-2xl mx-auto space-y-5">

        {success && (
          <div className="px-5 py-4 rounded-xl text-sm font-medium" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.4)', color: '#10B981' }}>
            ✓ Deposit submitted successfully. Awaiting admin approval.
          </div>
        )}

        {/* NETWORK SELECTOR */}
        <div className="rounded-2xl p-4 sm:p-5" style={{ background: '#0f0d0d', border: '1px solid rgba(0,235,255,0.12)' }}>
          <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: '#7A8899' }}>
            Select Network
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {(Object.keys(WALLET_DATA) as NetworkType[]).map((key) => {
              const w = WALLET_DATA[key];
              const active = network === key;
              return (
                <button key={key} type="button" onClick={() => setNetwork(key)}
                  className="flex-shrink-0 flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl transition-all duration-200"
                  style={{
                    minWidth: 72,
                    background: active ? 'rgba(0,235,255,0.1)' : 'rgba(255,255,255,0.03)',
                    border: active ? '1.5px solid rgba(0,235,255,0.55)' : '1.5px solid rgba(255,255,255,0.07)',
                    boxShadow: active ? '0 0 18px rgba(0,235,255,0.12)' : 'none',
                  }}>
                  <CryptoIcon symbol={w.symbol} size={36} />
                  <span className="text-xs font-bold" style={{ color: active ? '#00EBFF' : '#C0B8B8' }}>{w.label}</span>
                  <span className="text-xs" style={{ color: active ? '#8899AA' : '#5A6677', fontSize: 10 }}>{w.sublabel.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* WALLET ADDRESS CARD */}
        <div className="rounded-2xl overflow-hidden" style={{ background: '#0f0d0d', border: '1px solid rgba(0,235,255,0.15)' }}>
          <div style={{ height: 2, background: 'linear-gradient(90deg, transparent, #FFC0CB55, #E6E6FA77, #B0E0E6AA, #00EBFF66, transparent)' }} />
          <div className="p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 animate-pulse" style={{ background: wallet.color }} />
              <span className="text-xs font-bold tracking-widest uppercase" style={{ color: '#00EBFF' }}>
                {wallet.label} · {wallet.sublabel}
              </span>
            </div>

            {/* QR code */}
            <div className="flex justify-center mb-5">
              <button type="button" onClick={() => setQrZoomed(true)}
                className="relative rounded-2xl overflow-hidden transition-all duration-200 active:scale-95"
                style={{ border: '2px solid rgba(0,235,255,0.25)', background: '#fff', boxShadow: '0 0 24px rgba(0,235,255,0.1)' }}>
                <img src={wallet.qrImage} alt="QR Code" className="w-44 h-44 sm:w-52 sm:h-52 object-contain block"
                  onError={e => { (e.target as HTMLImageElement).style.opacity = '0.3'; }} />
                <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-1 py-1.5"
                  style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}>
                  <ZoomIn className="w-3 h-3" style={{ color: '#00EBFF' }} />
                  <span className="text-xs font-medium" style={{ color: '#00EBFF' }}>Tap to zoom</span>
                </div>
              </button>
            </div>

            {/* Address */}
            <div className="rounded-xl p-4 mb-4" style={{ background: 'rgba(0,235,255,0.04)', border: '1px solid rgba(0,235,255,0.1)' }}>
              <p className="text-xs font-semibold mb-2" style={{ color: '#7A8899' }}>Wallet Address</p>
              <code className="block text-sm leading-relaxed break-all" style={{ color: '#F5F5F0', fontFamily: 'monospace' }}>
                {wallet.address}
              </code>
            </div>

            <button type="button" onClick={() => copyToClipboard(wallet.address)}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all duration-200 active:scale-[0.98]"
              style={{
                background: copied ? 'rgba(16,185,129,0.15)' : 'rgba(0,235,255,0.12)',
                border: copied ? '1.5px solid rgba(16,185,129,0.5)' : '1.5px solid rgba(0,235,255,0.4)',
                color: copied ? '#10B981' : '#00EBFF',
              }}>
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Address Copied!' : 'Copy Wallet Address'}
            </button>

            <div className="mt-4 flex gap-2 px-3 py-3 rounded-lg" style={{ background: 'rgba(234,179,8,0.06)', border: '1px solid rgba(234,179,8,0.15)' }}>
              <span style={{ color: '#EAB308', fontSize: 14, flexShrink: 0 }}>⚠</span>
              <p className="text-xs leading-relaxed" style={{ color: '#A0B0C0' }}>
                Only send <strong style={{ color: '#F5F5F0' }}>{wallet.label}</strong> on the{' '}
                <strong style={{ color: '#F5F5F0' }}>{wallet.sublabel}</strong>. Sending the wrong asset may result in permanent loss.
              </p>
            </div>
          </div>
        </div>

        {/* SUBMIT FORM */}
        <div className="rounded-2xl p-4 sm:p-6" style={{ background: '#0f0d0d', border: '1px solid rgba(0,235,255,0.12)' }}>
          <p className="text-xs font-semibold tracking-widest uppercase mb-5" style={{ color: '#7A8899' }}>
            Confirm Deposit
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Amount */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#C0B8B8' }}>
                Amount (USD equivalent) <span style={{ color: '#00EBFF' }}>*</span>
              </label>
              <input
                type="number" required min="100" step="0.01"
                value={amount} onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl focus:outline-none transition-all text-base"
                style={{ background: '#0a0808', border: '1.5px solid rgba(0,235,255,0.15)', color: '#F5F5F0' }}
                placeholder="Minimum: $100"
                onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,235,255,0.5)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'rgba(0,235,255,0.15)')}
              />
            </div>

            {/* Proof upload */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#C0B8B8' }}>
                Upload Proof of Payment <span style={{ color: '#00EBFF' }}>*</span>
              </label>
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                onChange={handleProofSelect}
                className="hidden"
                id="proof-upload"
              />

              {proofPreview ? (
                /* Preview of selected image */
                <div className="rounded-xl overflow-hidden relative"
                  style={{ border: '2px solid rgba(0,235,255,0.35)', background: '#0a0808' }}>
                  <img
                    src={proofPreview}
                    alt="Payment proof preview"
                    className="w-full max-h-56 object-contain cursor-pointer"
                    onClick={() => setProofZoomed(true)}
                  />
                  <div className="absolute top-2 right-2 flex gap-2">
                    <button type="button" onClick={() => setProofZoomed(true)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1"
                      style={{ background: 'rgba(0,0,0,0.7)', color: '#00EBFF', border: '1px solid rgba(0,235,255,0.4)' }}>
                      <ZoomIn className="w-3 h-3" /> Zoom
                    </button>
                    <label htmlFor="proof-upload"
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1"
                      style={{ background: 'rgba(0,0,0,0.7)', color: '#C0B8B8', border: '1px solid rgba(85,78,78,0.5)' }}>
                      <Image className="w-3 h-3" /> Change
                    </label>
                  </div>
                  <div className="px-3 py-2 flex items-center gap-2" style={{ borderTop: '1px solid rgba(0,235,255,0.15)' }}>
                    <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#4ADE80' }} />
                    <span className="text-xs truncate" style={{ color: '#4ADE80' }}>{proofFile?.name}</span>
                  </div>
                </div>
              ) : (
                <label htmlFor="proof-upload"
                  className="flex flex-col items-center justify-center gap-2 w-full py-8 rounded-xl cursor-pointer transition-all duration-200 active:scale-[0.98]"
                  style={{ border: '2px dashed rgba(0,235,255,0.2)', background: 'transparent' }}>
                  <Upload className="w-8 h-8" style={{ color: '#5A6677' }} />
                  <span className="text-sm font-medium text-center px-4" style={{ color: '#8899AA' }}>
                    Tap to upload payment screenshot
                  </span>
                  <span className="text-xs" style={{ color: '#5A6677' }}>PNG, JPG, WebP up to 15 MB</span>
                </label>
              )}
            </div>

            {error && (
              <div className="px-4 py-3 rounded-xl text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444' }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={submitting || !proofFile}
              className="w-full py-4 rounded-xl font-bold text-base transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
              style={{ background: '#00EBFF', color: '#080808', boxShadow: '0 0 32px rgba(0,235,255,0.3)' }}>
              {submitting ? 'Uploading & Submitting…' : 'Submit Deposit'}
            </button>
          </form>
        </div>

        {/* DEPOSIT HISTORY */}
        <div className="rounded-2xl p-4 sm:p-6" style={{ background: '#0f0d0d', border: '1px solid rgba(0,235,255,0.12)' }}>
          <p className="text-xs font-semibold tracking-widest uppercase mb-5" style={{ color: '#7A8899' }}>
            Deposit History
          </p>
          {deposits.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
                style={{ background: 'rgba(0,235,255,0.06)', border: '1px solid rgba(0,235,255,0.12)' }}>
                <Clock className="w-6 h-6" style={{ color: '#5A6677' }} />
              </div>
              <p className="text-sm font-medium" style={{ color: '#8899AA' }}>No deposits yet</p>
              <p className="text-xs mt-1" style={{ color: '#5A6677' }}>Your deposit history will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {deposits.map((deposit) => (
                <div key={deposit.id} className="rounded-xl p-4"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(0,235,255,0.08)' }}>
                  <div className="flex items-start justify-between mb-1.5">
                    <div>
                      <div className="font-bold text-base" style={{ color: '#00EBFF' }}>
                        ${Number(deposit.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: '#8899AA' }}>{deposit.network} Network</div>
                      <div className="text-xs" style={{ color: '#5A6677' }}>
                        {new Date(deposit.created_at).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      {deposit.status === 'pending' && (
                        <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
                          style={{ background: 'rgba(234,179,8,0.1)', color: '#EAB308', border: '1px solid rgba(234,179,8,0.2)' }}>
                          <Clock className="w-3 h-3" /> Pending
                        </span>
                      )}
                      {deposit.status === 'approved' && (
                        <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
                          style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981', border: '1px solid rgba(16,185,129,0.2)' }}>
                          <CheckCircle className="w-3 h-3" /> Approved
                        </span>
                      )}
                      {deposit.status === 'rejected' && (
                        <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
                          style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                          <XCircle className="w-3 h-3" /> Rejected
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Show proof thumbnail if available */}
                  {deposit.proof_url && (
                    <div className="mt-2">
                      <p className="text-xs mb-1.5" style={{ color: '#5A6677' }}>Payment proof attached</p>
                      <img
                        src={deposit.proof_url}
                        alt="Payment proof"
                        className="max-h-24 rounded-lg object-contain cursor-pointer"
                        style={{ border: '1px solid rgba(0,235,255,0.2)' }}
                        onClick={() => window.open(deposit.proof_url, '_blank')}
                      />
                    </div>
                  )}
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
