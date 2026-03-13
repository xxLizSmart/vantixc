import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  User, CheckCircle, Clock, XCircle,
  DollarSign, ArrowUpRight, TrendingUp, Shield, Camera, Edit2,
} from 'lucide-react';

interface ProfileStats {
  totalDeposited: number;
  totalWithdrawn: number;
  totalTrades: number;
  winCount: number;
  lossCount: number;
  depositCount: number;
  withdrawalCount: number;
}

export default function ProfilePage() {
  const { user, profile, updateProfileLocally } = useAuth();
  const [username, setUsername]         = useState(profile?.username || '');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile]     = useState<File | null>(null);
  const [editing, setEditing]           = useState(false);
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState('');
  const [success, setSuccess]           = useState('');
  const [stats, setStats]               = useState<ProfileStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const fileRef   = useRef<HTMLInputElement>(null);
  const fetchedRef = useRef<string | null>(null);

  // Sync username input when profile loads
  useEffect(() => {
    if (profile?.username) setUsername(profile.username);
  }, [profile?.username]);

  // Load stats once per user id
  useEffect(() => {
    const id = profile?.id;
    if (!id) return;
    if (fetchedRef.current === id) return;
    fetchedRef.current = id;
    loadStats(id);
  }, [profile?.id]);

  const loadStats = async (userId: string) => {
    setStatsLoading(true);
    try {
      const { data, error: err } = await supabase
        .from('transactions')
        .select('type, amount, status')
        .eq('user_id', userId);

      if (err) throw err;

      const rows = data || [];
      const deposits    = rows.filter(r => r.type === 'deposit');
      const withdrawals = rows.filter(r => r.type === 'withdrawal' || r.type === 'withdraw');
      const trades      = rows.filter(r => r.type === 'trade');

      // Also pull trade outcomes from trades table
      const { data: tradeRows } = await supabase
        .from('trades')
        .select('outcome')
        .eq('user_id', userId)
        .neq('outcome', 'pending');

      setStats({
        totalDeposited:  deposits.filter(d => d.status === 'approved' || d.status === 'completed').reduce((s, d) => s + (d.amount || 0), 0),
        totalWithdrawn:  withdrawals.filter(w => w.status === 'approved' || w.status === 'completed').reduce((s, w) => s + (w.amount || 0), 0),
        totalTrades:     (tradeRows || []).length,
        winCount:        (tradeRows || []).filter(t => t.outcome === 'win').length,
        lossCount:       (tradeRows || []).filter(t => t.outcome === 'loss').length,
        depositCount:    deposits.length,
        withdrawalCount: withdrawals.length,
      });
    } catch (e: any) {
      console.error('ProfilePage loadStats error:', e?.message);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Only JPEG, PNG or WebP accepted'); return;
    }
    if (file.size > 5 * 1024 * 1024) { setError('Max file size is 5 MB'); return; }
    setError('');
    setAvatarFile(file);
    const r = new FileReader();
    r.onloadend = () => setAvatarPreview(r.result as string);
    r.readAsDataURL(file);
  };

  const uploadAvatar = async (file: File, userId: string): Promise<string | null> => {
    const ext  = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `avatars/${userId}.${ext}`;

    // Try Supabase Storage first (bucket: avatars)
    const { error: upErr } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true, contentType: file.type });

    if (!upErr) {
      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      // Bust cache with timestamp
      return `${data.publicUrl}?t=${Date.now()}`;
    }

    // Fallback: store as base64 directly in profile row
    // (works even if Storage bucket doesn't exist)
    console.warn('[ProfilePage] Storage upload failed, falling back to base64:', upErr.message);
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true); setError(''); setSuccess('');
    try {
      const updates: Record<string, any> = {};

      const trimmed = username.trim();
      if (trimmed && trimmed !== profile.username) {
        updates.username = trimmed;
      }

      if (avatarFile) {
        const url = await uploadAvatar(avatarFile, profile.id);
        if (url) updates.avatar_url = url;
      }

      if (Object.keys(updates).length === 0) {
        setEditing(false); setSaving(false); return;
      }

      const { error: err } = await supabase
        .from('profiles').update(updates).eq('id', profile.id);
      if (err) throw err;

      updateProfileLocally(updates);
      setAvatarFile(null);
      setAvatarPreview(null);
      setEditing(false);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 4000);
    } catch (e: any) {
      setError(e.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setUsername(profile?.username || '');
    setAvatarFile(null);
    setAvatarPreview(null);
    setError('');
  };

  const avatarSrc = avatarPreview || profile?.avatar_url || null;

  return (
    <div className="min-h-screen py-8 px-4 pb-28" style={{ background: '#080808' }}>
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <h1 className="text-2xl font-bold" style={{ color: '#F5F5F0' }}>My Profile</h1>

        {/* Success / Error banners */}
        {success && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
            style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)', color: '#4ADE80' }}>
            <CheckCircle className="w-4 h-4 flex-shrink-0" /> {success}
          </div>
        )}
        {error && (
          <div className="px-4 py-3 rounded-xl text-sm"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444' }}>
            {error}
          </div>
        )}

        {/* ── Profile Card ── */}
        <div className="rounded-2xl p-6" style={{ background: '#1a1414', border: '1px solid rgba(0,235,255,0.15)' }}>
          <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">

            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-28 h-28 rounded-full overflow-hidden"
                style={{ border: '3px solid rgba(0,235,255,0.4)', boxShadow: '0 0 20px rgba(0,235,255,0.15)' }}>
                {avatarSrc ? (
                  <img src={avatarSrc} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ background: '#2e2929' }}>
                    <User className="w-14 h-14" style={{ color: '#554e4e' }} />
                  </div>
                )}
              </div>
              {/* Camera button — always visible so user can tap it directly */}
              <button
                onClick={() => { setEditing(true); setTimeout(() => fileRef.current?.click(), 50); }}
                className="absolute bottom-0 right-0 w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                style={{ background: '#00EBFF', boxShadow: '0 0 14px rgba(0,235,255,0.55)' }}
                title="Change avatar">
                <Camera className="w-4 h-4" style={{ color: '#080808' }} />
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>

            {/* Info / Edit form */}
            <div className="flex-1 w-full text-center sm:text-left">
              {editing ? (
                <div className="space-y-3">
                  {avatarPreview && (
                    <p className="text-xs" style={{ color: '#4ADE80' }}>
                      ✓ New avatar selected — save to apply
                    </p>
                  )}
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: '#C0B8B8' }}>Username</label>
                    <input
                      type="text"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      maxLength={32}
                      className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none"
                      style={{
                        background: '#0d0a0a',
                        border: '1px solid rgba(0,235,255,0.3)',
                        color: '#F5F5F0',
                        outline: 'none',
                      }}
                      placeholder="Enter username"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleSave} disabled={saving}
                      className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
                      style={{ background: '#00EBFF', color: '#080808' }}>
                      {saving ? 'Saving…' : 'Save Changes'}
                    </button>
                    <button onClick={handleCancel} disabled={saving}
                      className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
                      style={{ background: 'rgba(85,78,78,0.3)', border: '1px solid rgba(85,78,78,0.5)', color: '#C0B8B8' }}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 justify-center sm:justify-start mb-1">
                    <h2 className="text-xl font-bold" style={{ color: '#F5F5F0' }}>
                      {profile?.username || 'Unnamed Trader'}
                    </h2>
                    {profile?.is_admin && (
                      <span className="px-2 py-0.5 rounded text-xs font-bold"
                        style={{ background: 'rgba(255,179,71,0.15)', border: '1px solid rgba(255,179,71,0.4)', color: '#FFB347' }}>
                        ADMIN
                      </span>
                    )}
                  </div>
                  <div className="text-sm mb-3" style={{ color: '#C0B8B8' }}>{user?.email}</div>
                  <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start mb-4">
                    {profile?.kyc_status === 'verified' && (
                      <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold"
                        style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)', color: '#4ADE80' }}>
                        <CheckCircle className="w-3 h-3" /> Verified
                      </span>
                    )}
                    {profile?.kyc_status === 'pending' && (
                      <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold"
                        style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', color: '#FBbf24' }}>
                        <Clock className="w-3 h-3" /> KYC Pending
                      </span>
                    )}
                    {profile?.kyc_status === 'not_verified' && (
                      <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold"
                        style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444' }}>
                        <XCircle className="w-3 h-3" /> Not Verified
                      </span>
                    )}
                  </div>
                  <button onClick={() => setEditing(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:scale-105 active:scale-95"
                    style={{ background: 'rgba(0,235,255,0.1)', border: '1px solid rgba(0,235,255,0.3)', color: '#00EBFF' }}>
                    <Edit2 className="w-4 h-4" /> Edit Profile
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Account meta row */}
          {!editing && (
            <div className="grid grid-cols-3 gap-3 mt-6 pt-6" style={{ borderTop: '1px solid rgba(85,78,78,0.3)' }}>
              <div className="text-center">
                <div className="text-xs mb-1" style={{ color: '#C0B8B8' }}>Member Since</div>
                <div className="text-sm font-semibold" style={{ color: '#F5F5F0' }}>
                  {profile?.created_at
                    ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                    : '—'}
                </div>
              </div>
              <div className="text-center" style={{ borderLeft: '1px solid rgba(85,78,78,0.3)', borderRight: '1px solid rgba(85,78,78,0.3)' }}>
                <div className="text-xs mb-1" style={{ color: '#C0B8B8' }}>Account Type</div>
                <div className="text-sm font-semibold" style={{ color: '#F5F5F0' }}>
                  {profile?.is_admin ? 'Admin' : 'Trader'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs mb-1" style={{ color: '#C0B8B8' }}>Total Trades</div>
                <div className="text-sm font-semibold" style={{ color: '#00EBFF' }}>
                  {stats ? stats.totalTrades : '—'}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Account Statistics ── */}
        <div className="rounded-2xl p-6" style={{ background: '#1a1414', border: '1px solid rgba(0,235,255,0.15)' }}>
          <h3 className="text-base font-bold mb-4" style={{ color: '#F5F5F0' }}>Account Statistics</h3>
          {statsLoading ? (
            <div className="flex items-center justify-center py-6 gap-3">
              <div className="w-5 h-5 border-2 rounded-full animate-spin"
                style={{ borderColor: '#00EBFF', borderTopColor: 'transparent' }} />
              <span className="text-sm" style={{ color: '#C0B8B8' }}>Loading stats…</span>
            </div>
          ) : stats ? (
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Total Deposited',  value: `$${stats.totalDeposited.toFixed(2)}`,  icon: DollarSign,  color: '#4ADE80',  sub: `${stats.depositCount} deposits` },
                { label: 'Total Withdrawn',  value: `$${stats.totalWithdrawn.toFixed(2)}`,  icon: ArrowUpRight, color: '#EF4444', sub: `${stats.withdrawalCount} withdrawals` },
                { label: 'Total Trades',     value: String(stats.totalTrades),               icon: TrendingUp,  color: '#00EBFF',  sub: `${stats.winCount}W / ${stats.lossCount}L` },
                { label: 'KYC Status',
                  value: profile?.kyc_status === 'verified' ? 'Verified' : profile?.kyc_status === 'pending' ? 'Pending' : 'Unverified',
                  icon: Shield,
                  color: profile?.kyc_status === 'verified' ? '#4ADE80' : profile?.kyc_status === 'pending' ? '#FBbf24' : '#EF4444',
                  sub: 'Identity check' },
              ].map(s => (
                <div key={s.label} className="rounded-xl p-4"
                  style={{ background: '#0d0a0a', border: '1px solid rgba(85,78,78,0.3)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs" style={{ color: '#C0B8B8' }}>{s.label}</span>
                    <s.icon className="w-4 h-4" style={{ color: s.color }} />
                  </div>
                  <div className="text-lg font-bold mb-0.5" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-xs" style={{ color: '#C0B8B8' }}>{s.sub}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-center py-4" style={{ color: '#C0B8B8' }}>No stats available yet</p>
          )}
        </div>

        {/* ── Asset Balances ── */}
        <div className="rounded-2xl p-6" style={{ background: '#1a1414', border: '1px solid rgba(0,235,255,0.15)' }}>
          <h3 className="text-base font-bold mb-4" style={{ color: '#F5F5F0' }}>Asset Balances</h3>
          <div className="space-y-2">
            {([
              { symbol: 'BTC',  label: 'Bitcoin',   field: 'btc_balance'  },
              { symbol: 'ETH',  label: 'Ethereum',  field: 'eth_balance'  },
              { symbol: 'USDT', label: 'Tether',    field: 'usdt_balance' },
              { symbol: 'USDC', label: 'USD Coin',  field: 'usdc_balance' },
              { symbol: 'XRP',  label: 'Ripple',    field: 'xrp_balance'  },
              { symbol: 'SOL',  label: 'Solana',    field: 'sol_balance'  },
            ] as const).map(a => {
              const bal = profile ? ((profile[a.field as keyof typeof profile] as number) || 0) : 0;
              return (
                <div key={a.symbol} className="flex items-center justify-between px-4 py-3 rounded-xl"
                  style={{ background: '#0d0a0a', border: '1px solid rgba(85,78,78,0.25)' }}>
                  <div className="flex items-center gap-3">
                    <img
                      src={`https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/svg/color/${a.symbol.toLowerCase()}.svg`}
                      alt={a.symbol} className="w-8 h-8 rounded-full"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                    <div>
                      <div className="text-sm font-semibold" style={{ color: '#F5F5F0' }}>{a.symbol}</div>
                      <div className="text-xs" style={{ color: '#C0B8B8' }}>{a.label}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold" style={{ color: '#F5F5F0' }}>{bal.toFixed(6)}</div>
                    <div className="text-xs" style={{ color: '#00EBFF' }}>${bal.toFixed(2)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
