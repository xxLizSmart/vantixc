import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Profile } from '../lib/supabase';
import {
  Users, DollarSign, FileCheck, ArrowUpRight,
  Settings, TrendingUp, Activity, AlertCircle, RefreshCw, CheckCircle,
  Clock, ToggleLeft, ToggleRight, Plus, Trash2,
  Trophy, TrendingDown, Minus, ChevronDown, ChevronUp,
  ZoomIn, Upload, X,
} from 'lucide-react';

interface Deposit {
  id: string; user_id: string; amount: number; network: string;
  status: 'pending' | 'approved' | 'rejected'; proof_url?: string;
  created_at: string; reviewed_at?: string;
}
interface Withdrawal {
  id: string; user_id: string; amount: number; currency: string;
  wallet_address: string; status: 'pending' | 'approved' | 'rejected';
  created_at: string; reviewed_at?: string;
}
interface KYCRecord {
  id: string; user_id: string; full_name: string; phone_number: string;
  country: string; full_address: string; id_number: string;
  id_front_photo_url?: string; id_back_photo_url?: string;
  status: 'pending' | 'approved' | 'rejected'; created_at: string; reviewed_at?: string;
}
interface Stats {
  totalUsers: number; verifiedUsers: number;
  pendingDeposits: number; pendingWithdrawals: number;
  pendingKYC: number; platformBalance: number;
}
interface Trade {
  id: string;
  user_id: string;
  trade_type: string;
  amount: number;
  duration: number;
  outcome: string | null;
  profit_loss: number | null;
  created_at: string;
  completed_at: string | null;
}

interface TradeSetting {
  duration: number;        // PK — seconds
  label: string;
  min_capital: number;
  max_capital: number;
  win_percentage: number;
  loss_percentage: number;
  is_enabled: boolean;
}

// Default durations used when table has no rows yet
const DEFAULT_DURATIONS: TradeSetting[] = [
  { duration: 30,    label: '30 Seconds', min_capital: 1,  max_capital: 500,   win_percentage: 82, loss_percentage: 100, is_enabled: true  },
  { duration: 60,    label: '1 Minute',   min_capital: 1,  max_capital: 1000,  win_percentage: 85, loss_percentage: 100, is_enabled: true  },
  { duration: 180,   label: '3 Minutes',  min_capital: 5,  max_capital: 2000,  win_percentage: 87, loss_percentage: 100, is_enabled: true  },
  { duration: 300,   label: '5 Minutes',  min_capital: 5,  max_capital: 5000,  win_percentage: 88, loss_percentage: 100, is_enabled: true  },
  { duration: 900,   label: '15 Minutes', min_capital: 10, max_capital: 10000, win_percentage: 90, loss_percentage: 100, is_enabled: true  },
  { duration: 1800,  label: '30 Minutes', min_capital: 10, max_capital: 10000, win_percentage: 92, loss_percentage: 100, is_enabled: true  },
  { duration: 3600,  label: '1 Hour',     min_capital: 20, max_capital: 20000, win_percentage: 93, loss_percentage: 100, is_enabled: false },
  { duration: 14400, label: '4 Hours',    min_capital: 50, max_capital: 50000, win_percentage: 95, loss_percentage: 100, is_enabled: false },
];

export default function AdminPanel() {
  const { profile } = useAuth();
  const [tab, setTab] = useState<'users' | 'deposits' | 'withdrawals' | 'kyc' | 'trade' | 'traderesult' | 'settings'>('users');
  const [users,         setUsers]         = useState<Profile[]>([]);
  const [deposits,      setDeposits]      = useState<Deposit[]>([]);
  const [withdrawals,   setWithdrawals]   = useState<Withdrawal[]>([]);
  const [kyc,           setKyc]           = useState<KYCRecord[]>([]);
  const [trades,        setTrades]        = useState<Trade[]>([]);
  const [tradeSettings, setTradeSettings] = useState<TradeSetting[]>([]);
  const [expandedUser,  setExpandedUser]  = useState<string | null>(null);

  // initialLoading = first-ever fetch (show full-page spinner)
  // refreshing     = subsequent fetches (show small indicator, keep content visible)
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing,     setRefreshing]     = useState(false);
  const [saveStatus,     setSaveStatus]     = useState<Record<string, 'saving' | 'saved' | 'error'>>({});
  const loadedRef = useRef(false); // prevent re-triggering full load on profile object changes

  // Proof image lightbox
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // QR upload state (Settings tab)
  const [qrUploading, setQrUploading] = useState<string | null>(null); // network key being uploaded
  const [qrUrls, setQrUrls] = useState<Record<string, string>>({});    // overrides from DB/storage
  const qrInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const [stats, setStats] = useState<Stats>({
    totalUsers: 0, verifiedUsers: 0,
    pendingDeposits: 0, pendingWithdrawals: 0,
    pendingKYC: 0, platformBalance: 0,
  });

  // ── Load all data ──────────────────────────────────────────────────────────
  const loadAll = useCallback(async (isInitial = false) => {
    if (isInitial) setInitialLoading(true);
    else setRefreshing(true);

    try {
      const [{ data: uData }, { data: dData }, { data: wData }, { data: kData }, { data: tsData }, { data: trData }] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('deposits').select('*').order('created_at', { ascending: false }),
        supabase.from('withdrawals').select('*').order('created_at', { ascending: false }),
        supabase.from('kyc_verifications').select('*').order('created_at', { ascending: false }),
        supabase.from('trade_settings').select('*').order('duration', { ascending: true }),
        supabase.from('trades').select('*').order('created_at', { ascending: false }),
      ]);

      const allUsers = (uData as Profile[]) || [];
      setUsers(allUsers);
      setDeposits((dData as Deposit[]) || []);
      setWithdrawals((wData as Withdrawal[]) || []);
      setKyc((kData as KYCRecord[]) || []);

      setTrades((trData as Trade[]) || []);

      // Merge fetched rows with defaults (defaults fill in missing fields)
      const fetchedTs = (tsData as any[]) || [];
      if (fetchedTs.length > 0) {
        setTradeSettings(fetchedTs.map(row => ({
          duration:        row.duration,
          label:           row.label ?? DEFAULT_DURATIONS.find(d => d.duration === row.duration)?.label ?? `${row.duration}s`,
          min_capital:     row.min_capital ?? 1,
          max_capital:     row.max_capital ?? 10000,
          win_percentage:  row.win_percentage ?? 85,
          loss_percentage: row.loss_percentage ?? 100,
          is_enabled:      row.is_enabled ?? true,
        })));
      } else {
        setTradeSettings(DEFAULT_DURATIONS);
      }

      const platformBalance = allUsers.reduce((sum, u) =>
        sum + (u.btc_balance || 0) + (u.eth_balance || 0) + (u.usdc_balance || 0) +
              (u.usdt_balance || 0) + (u.xrp_balance || 0) + (u.sol_balance || 0), 0);

      setStats({
        totalUsers: allUsers.length,
        verifiedUsers: allUsers.filter(u => u.kyc_status === 'verified').length,
        pendingDeposits:    ((dData as Deposit[]) || []).filter(d => d.status === 'pending').length,
        pendingWithdrawals: ((wData as Withdrawal[]) || []).filter(w => w.status === 'pending').length,
        pendingKYC:         ((kData as KYCRecord[]) || []).filter(k => k.status === 'pending').length,
        platformBalance,
      });
    } catch (err) {
      console.error('[AdminPanel] loadAll error:', err);
    } finally {
      if (isInitial) setInitialLoading(false);
      else setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // Only run the initial full load once — when admin status is first confirmed.
    // Without this guard, every profile object update (Realtime, token refresh)
    // re-triggers loadAll(true) which resets initialLoading=true → stuck spinner.
    if (!profile?.is_admin) return;
    if (loadedRef.current) return;
    loadedRef.current = true;
    loadAll(true);
  }, [profile?.id, profile?.is_admin, loadAll]);

  // ── Save status helpers ────────────────────────────────────────────────────
  const markSaving = (key: string) => setSaveStatus(p => ({ ...p, [key]: 'saving' }));
  const markSaved  = (key: string) => {
    setSaveStatus(p => ({ ...p, [key]: 'saved' }));
    setTimeout(() => setSaveStatus(p => { const n = { ...p }; delete n[key]; return n; }), 2000);
  };
  const markError  = (key: string) => {
    setSaveStatus(p => ({ ...p, [key]: 'error' }));
    setTimeout(() => setSaveStatus(p => { const n = { ...p }; delete n[key]; return n; }), 3000);
  };

  // ── User actions ───────────────────────────────────────────────────────────
  const handleUpdateUserBalance = async (userId: string, field: string, value: number) => {
    const safe = Math.max(0, isNaN(value) ? 0 : value);
    const key  = `${userId}-${field}`;
    markSaving(key);
    const { error } = await supabase.from('profiles').update({ [field]: safe }).eq('id', userId);
    if (error) { console.error(error.message); markError(key); return; }
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, [field]: safe } : u));
    markSaved(key);
  };

  const handleAdjustBalance = (userId: string, field: string, current: number, delta: number) =>
    handleUpdateUserBalance(userId, field, Math.max(0, current + delta));

  const handleSetKYCStatus = async (userId: string, status: string) => {
    const key = `${userId}-kyc`;
    markSaving(key);
    const { error } = await supabase.from('profiles').update({ kyc_status: status }).eq('id', userId);
    if (error) { markError(key); return; }
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, kyc_status: status } : u));
    markSaved(key);
  };

  const handleToggleAdmin = async (userId: string, current: boolean) => {
    if (userId === profile?.id) { alert('Cannot change your own admin status'); return; }
    const key = `${userId}-admin`;
    markSaving(key);
    const { error } = await supabase.from('profiles').update({ is_admin: !current }).eq('id', userId);
    if (error) { markError(key); return; }
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_admin: !current } : u));
    markSaved(key);
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === profile?.id) { alert('Cannot delete your own account'); return; }
    if (!confirm('Delete this user permanently? This cannot be undone.')) return;
    await Promise.all([
      supabase.from('trades').delete().eq('user_id', userId),
      supabase.from('transactions').delete().eq('user_id', userId),
      supabase.from('deposits').delete().eq('user_id', userId),
      supabase.from('withdrawals').delete().eq('user_id', userId),
      supabase.from('kyc_verifications').delete().eq('user_id', userId),
      supabase.from('profiles').delete().eq('id', userId),
    ]);
    setUsers(prev => prev.filter(u => u.id !== userId));
    setStats(prev => ({ ...prev, totalUsers: prev.totalUsers - 1 }));
  };

  // ── Deposit actions ────────────────────────────────────────────────────────
  const handleDepositAction = async (id: string, status: 'approved' | 'rejected') => {
    const dep = deposits.find(d => d.id === id);
    if (!dep) return;
    // Optimistic update immediately
    setDeposits(prev => prev.map(d => d.id === id ? { ...d, status, reviewed_at: new Date().toISOString() } : d));
    setStats(prev => ({ ...prev, pendingDeposits: Math.max(0, prev.pendingDeposits - 1) }));

    await supabase.from('deposits').update({ status, reviewed_at: new Date().toISOString() }).eq('id', id);

    if (status === 'approved') {
      const { data: p } = await supabase.from('profiles').select('usdt_balance').eq('id', dep.user_id).single();
      if (p) {
        await supabase.from('profiles').update({ usdt_balance: (p.usdt_balance || 0) + dep.amount }).eq('id', dep.user_id);
        await supabase.from('transactions').insert({
          user_id: dep.user_id, type: 'deposit', amount: dep.amount,
          currency: 'USDT', status: 'approved', details: { deposit_id: id },
        });
        // Update local user balance too
        setUsers(prev => prev.map(u => u.id === dep.user_id
          ? { ...u, usdt_balance: (u.usdt_balance || 0) + dep.amount } : u));
      }
    }
  };

  // ── Withdrawal actions ─────────────────────────────────────────────────────
  const handleWithdrawalAction = async (id: string, status: 'approved' | 'rejected') => {
    const wd = withdrawals.find(w => w.id === id);
    if (!wd) return;
    // Optimistic update immediately
    setWithdrawals(prev => prev.map(w => w.id === id ? { ...w, status } : w));
    setStats(prev => ({ ...prev, pendingWithdrawals: Math.max(0, prev.pendingWithdrawals - 1) }));

    await supabase.from('withdrawals').update({ status, reviewed_at: new Date().toISOString() }).eq('id', id);

    if (status === 'rejected') {
      const field = `${wd.currency.toLowerCase()}_balance`;
      const { data: p } = await supabase.from('profiles').select(field).eq('id', wd.user_id).single();
      if (p) {
        await supabase.from('profiles').update({ [field]: ((p as any)[field] || 0) + wd.amount }).eq('id', wd.user_id);
        setUsers(prev => prev.map(u => u.id === wd.user_id
          ? { ...u, [field]: ((u as any)[field] || 0) + wd.amount } : u));
      }
    }
  };

  // ── KYC actions ────────────────────────────────────────────────────────────
  const handleKYCAction = async (id: string, status: 'approved' | 'rejected') => {
    const record = kyc.find(k => k.id === id);
    if (!record) return;
    const profileStatus = status === 'approved' ? 'verified' : 'not_verified';
    // Optimistic update immediately
    setKyc(prev => prev.map(k => k.id === id ? { ...k, status, reviewed_at: new Date().toISOString() } : k));
    setUsers(prev => prev.map(u => u.id === record.user_id ? { ...u, kyc_status: profileStatus } : u));
    setStats(prev => ({ ...prev, pendingKYC: Math.max(0, prev.pendingKYC - 1) }));

    await supabase.from('kyc_verifications').update({ status, reviewed_at: new Date().toISOString() }).eq('id', id);
    await supabase.from('profiles').update({ kyc_status: profileStatus }).eq('id', record.user_id);
  };

  // ── Trade settings actions ─────────────────────────────────────────────────
  const handleSaveTradeSetting = async (row: TradeSetting) => {
    const key = `trade-${row.duration}`;
    markSaving(key);
    const { error } = await supabase
      .from('trade_settings')
      .upsert({
        duration:        row.duration,
        label:           row.label,
        min_capital:     row.min_capital,
        max_capital:     row.max_capital,
        win_percentage:  row.win_percentage,
        loss_percentage: row.loss_percentage,
        is_enabled:      row.is_enabled,
      }, { onConflict: 'duration' });
    if (error) { console.error(error); markError(key); return; }
    setTradeSettings(prev => prev.map(r => r.duration === row.duration ? row : r));
    markSaved(key);
  };

  const handleToggleDuration = async (duration: number, current: boolean) => {
    const row = tradeSettings.find(r => r.duration === duration);
    if (!row) return;
    const updated = { ...row, is_enabled: !current };
    await handleSaveTradeSetting(updated);
  };

  const handleTradeFieldChange = (duration: number, field: keyof TradeSetting, value: string | number | boolean) => {
    setTradeSettings(prev => prev.map(r => r.duration === duration ? { ...r, [field]: value } : r));
  };

  const handleDeleteTradeSetting = async (duration: number) => {
    if (!confirm(`Delete the ${tradeSettings.find(r => r.duration === duration)?.label} duration?`)) return;
    const { error } = await supabase.from('trade_settings').delete().eq('duration', duration);
    if (error) { console.error(error); return; }
    setTradeSettings(prev => prev.filter(r => r.duration !== duration));
  };

  const handleAddTradeSetting = () => {
    const newDuration = 7200; // default 2h — admin can change it
    if (tradeSettings.find(r => r.duration === newDuration)) return;
    const newRow: TradeSetting = {
      duration: newDuration, label: '2 Hours', min_capital: 20, max_capital: 20000,
      win_percentage: 90, loss_percentage: 100, is_enabled: false,
    };
    setTradeSettings(prev => [...prev, newRow]);
  };

  // ── Trade result actions ───────────────────────────────────────────────────
  const handleSetForcedResult = async (userId: string, result: 'win' | 'loss' | null) => {
    const key = `${userId}-forced`;
    markSaving(key);
    const { error } = await supabase
      .from('profiles')
      .update({ forced_result: result })
      .eq('id', userId);
    if (error) {
      // Column might not exist yet — show friendly error
      console.error('[forced_result]', error.message);
      markError(key);
      return;
    }
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, forced_result: result } : u));
    markSaved(key);
  };

  const handleOverrideTrade = async (tradeId: string, outcome: 'win' | 'loss') => {
    const trade = trades.find(t => t.id === tradeId);
    if (!trade) return;
    const key = `trade-outcome-${tradeId}`;
    markSaving(key);

    // Recalculate profit_loss from trade_settings if available
    const setting = tradeSettings.find(s => s.duration === trade.duration);
    const profitLoss = outcome === 'win'
      ? (setting ? trade.amount * (setting.win_percentage / 100) : trade.amount * 0.85)
      : -(setting ? trade.amount * (setting.loss_percentage / 100) : trade.amount);

    const { error } = await supabase
      .from('trades')
      .update({ outcome, profit_loss: profitLoss, completed_at: new Date().toISOString() })
      .eq('id', tradeId);

    if (error) { console.error(error); markError(key); return; }
    setTrades(prev => prev.map(t => t.id === tradeId
      ? { ...t, outcome, profit_loss: profitLoss, completed_at: new Date().toISOString() }
      : t
    ));
    markSaved(key);
  };

  // ── QR upload ──────────────────────────────────────────────────────────────
  const handleQrUpload = async (networkKey: string, file: File) => {
    setQrUploading(networkKey);
    try {
      const ext  = file.name.split('.').pop()?.toLowerCase() || 'png';
      const path = `qr/${networkKey.toLowerCase()}.${ext}`;
      const { error } = await supabase.storage
        .from('assets')
        .upload(path, file, { upsert: true, contentType: file.type });

      let publicUrl = '';
      if (!error) {
        const { data } = supabase.storage.from('assets').getPublicUrl(path);
        publicUrl = `${data.publicUrl}?t=${Date.now()}`;
      } else {
        // Fallback to base64 stored in a settings row
        console.warn('[AdminPanel] QR storage upload failed:', error.message);
        publicUrl = await new Promise<string>((resolve, reject) => {
          const r = new FileReader();
          r.onload  = () => resolve(r.result as string);
          r.onerror = reject;
          r.readAsDataURL(file);
        });
      }

      // Persist to platform_settings table if it exists, else just update local state
      await supabase.from('platform_settings' as any)
        .upsert({ key: `qr_${networkKey}`, value: publicUrl }, { onConflict: 'key' })
        .select();

      setQrUrls(prev => ({ ...prev, [networkKey]: publicUrl }));
    } catch (e: any) {
      console.error('[AdminPanel] QR upload error:', e.message);
    } finally {
      setQrUploading(null);
    }
  };

  // ── Guards ─────────────────────────────────────────────────────────────────
  // Profile not yet loaded — show spinner briefly (max ~5s via AuthContext timeout)
  if (profile === null) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#080808' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 rounded-full animate-spin"
            style={{ borderColor: '#00EBFF', borderTopColor: 'transparent' }} />
          <div style={{ color: '#C0B8B8' }}>Verifying credentials…</div>
        </div>
      </div>
    );
  }

  // Profile loaded but not admin
  if (!profile.is_admin) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#080808' }}>
        <div className="text-center p-8 rounded-xl border" style={{ background: '#1a1414', borderColor: 'rgba(0,235,255,0.2)' }}>
          <AlertCircle className="w-12 h-12 mx-auto mb-4" style={{ color: '#00EBFF' }} />
          <div className="text-xl font-bold" style={{ color: '#F5F5F0' }}>Access Denied</div>
          <div className="mt-2 text-sm" style={{ color: '#C0B8B8' }}>Admin credentials required</div>
        </div>
      </div>
    );
  }

  // ── Derived ────────────────────────────────────────────────────────────────
  const pendingDeposits    = deposits.filter(d => d.status === 'pending');
  const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending');
  const pendingKYC         = kyc.filter(k => k.status === 'pending');

  const TABS = [
    { id: 'users',       label: 'Users',        icon: Users,         badge: stats.totalUsers },
    { id: 'deposits',    label: 'Deposits',     icon: DollarSign,    badge: stats.pendingDeposits },
    { id: 'withdrawals', label: 'Withdrawals',  icon: ArrowUpRight,  badge: stats.pendingWithdrawals },
    { id: 'kyc',         label: 'KYC',          icon: FileCheck,     badge: stats.pendingKYC },
    { id: 'trade',       label: 'Trade Config', icon: Clock,         badge: 0 },
    { id: 'traderesult', label: 'Trade Results',icon: Trophy,        badge: 0 },
    { id: 'settings',    label: 'Settings',     icon: Settings,      badge: 0 },
  ] as const;

  return (
    <div className="min-h-screen py-8 px-4 pb-24" style={{ background: '#080808' }}>

      {/* Proof image lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(8px)' }}
          onClick={() => setLightboxUrl(null)}
        >
          <div className="relative rounded-2xl overflow-hidden"
            style={{ background: '#1a1414', border: '1px solid rgba(0,235,255,0.3)', maxWidth: '90vw', maxHeight: '85vh' }}
            onClick={e => e.stopPropagation()}>
            <button onClick={() => setLightboxUrl(null)}
              className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.2)' }}>
              <X className="w-4 h-4" style={{ color: '#F5F5F0' }} />
            </button>
            <img src={lightboxUrl} alt="Payment Proof"
              className="block object-contain"
              style={{ maxWidth: '85vw', maxHeight: '80vh' }} />
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold" style={{ color: '#F5F5F0' }}>Admin Panel</h1>
          <button
            onClick={() => loadAll(false)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60"
            style={{ background: 'rgba(0,235,255,0.1)', border: '1px solid rgba(0,235,255,0.3)', color: '#00EBFF' }}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Users',      value: stats.totalUsers,      sub: `${stats.verifiedUsers} verified`,      icon: Users },
            { label: 'Platform Balance', value: `$${stats.platformBalance.toFixed(2)}`, sub: 'Total assets',        icon: TrendingUp },
            { label: 'Pending Actions',  value: stats.pendingDeposits + stats.pendingWithdrawals + stats.pendingKYC,
              sub: `${stats.pendingDeposits}dep · ${stats.pendingWithdrawals}wd · ${stats.pendingKYC}kyc`,           icon: AlertCircle },
            { label: 'KYC Verified',     value: stats.verifiedUsers,   sub: `of ${stats.totalUsers} users`,         icon: Activity },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-5" style={{ background: '#1a1414', border: '1px solid rgba(0,235,255,0.12)' }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium" style={{ color: '#C0B8B8' }}>{s.label}</span>
                <s.icon className="w-4 h-4" style={{ color: '#00EBFF' }} />
              </div>
              <div className="text-2xl font-bold mb-1" style={{ color: '#F5F5F0' }}>{s.value}</div>
              <div className="text-xs" style={{ color: '#C0B8B8' }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap text-sm transition-all"
              style={tab === t.id
                ? { background: 'rgba(0,235,255,0.15)', border: '1px solid rgba(0,235,255,0.5)', color: '#00EBFF' }
                : { background: '#1a1414', border: '1px solid rgba(85,78,78,0.5)', color: '#C0B8B8' }}>
              <t.icon className="w-4 h-4" />
              {t.label}
              {t.badge > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-xs font-bold"
                  style={{ background: '#00EBFF', color: '#080808' }}>
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content — never shows a loading spinner; uses optimistic + per-field save indicators */}
        <div className="rounded-xl p-6" style={{ background: '#1a1414', border: '1px solid rgba(0,235,255,0.12)' }}>

          {/* ── USERS ────────────────────────────────────────────────────── */}
          {tab === 'users' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-semibold" style={{ color: '#F5F5F0' }}>User Management</h2>
                <span className="text-sm" style={{ color: '#C0B8B8' }}>{users.length} users</span>
              </div>
              {users.length === 0
                ? <div className="text-center py-12" style={{ color: '#C0B8B8' }}>No users yet</div>
                : users.map(u => (
                  <div key={u.id} className="rounded-xl p-5"
                    style={{ background: '#0d0a0a', border: '1px solid rgba(85,78,78,0.4)' }}>
                    {/* User header */}
                    <div className="flex flex-wrap justify-between items-start gap-3 mb-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-bold text-lg" style={{ color: '#F5F5F0' }}>{u.username || 'Unnamed'}</span>
                          {u.is_admin && (
                            <span className="px-2 py-0.5 rounded text-xs font-bold"
                              style={{ background: 'rgba(255,179,71,0.15)', border: '1px solid rgba(255,179,71,0.4)', color: '#FFB347' }}>
                              ADMIN
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded text-xs font-medium"
                            style={{
                              background: u.kyc_status === 'verified' ? 'rgba(74,222,128,0.1)' : u.kyc_status === 'pending' ? 'rgba(251,191,36,0.1)' : 'rgba(156,163,175,0.1)',
                              border: `1px solid ${u.kyc_status === 'verified' ? 'rgba(74,222,128,0.3)' : u.kyc_status === 'pending' ? 'rgba(251,191,36,0.3)' : 'rgba(156,163,175,0.3)'}`,
                              color: u.kyc_status === 'verified' ? '#4ADE80' : u.kyc_status === 'pending' ? '#FBbf24' : '#9CA3AF',
                            }}>
                            KYC: {(u.kyc_status || 'none').toUpperCase()}
                          </span>
                        </div>
                        <div className="text-xs" style={{ color: '#C0B8B8' }}>ID: {u.id}</div>
                        <div className="text-xs mt-0.5" style={{ color: '#C0B8B8' }}>
                          Joined: {new Date(u.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 items-center">
                        {/* KYC status dropdown with save indicator */}
                        <div className="flex items-center gap-1.5">
                          <select
                            value={u.kyc_status || 'not_verified'}
                            onChange={e => handleSetKYCStatus(u.id, e.target.value)}
                            className="px-2 py-1 rounded text-sm"
                            style={{ background: '#1a1414', border: '1px solid rgba(0,235,255,0.2)', color: '#F5F5F0' }}>
                            <option value="not_verified">Not Verified</option>
                            <option value="pending">Pending</option>
                            <option value="verified">Verified</option>
                          </select>
                          {saveStatus[`${u.id}-kyc`] === 'saving' && (
                            <div className="w-3.5 h-3.5 rounded-full border-2 animate-spin flex-shrink-0"
                              style={{ borderColor: '#00EBFF', borderTopColor: 'transparent' }} />
                          )}
                          {saveStatus[`${u.id}-kyc`] === 'saved' && (
                            <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#4ADE80' }} />
                          )}
                        </div>
                        <button
                          onClick={() => handleToggleAdmin(u.id, u.is_admin)}
                          disabled={u.id === profile?.id || saveStatus[`${u.id}-admin`] === 'saving'}
                          className="px-3 py-1 rounded text-sm disabled:opacity-40 flex items-center gap-1.5"
                          style={u.is_admin
                            ? { background: 'rgba(255,179,71,0.1)', border: '1px solid rgba(255,179,71,0.3)', color: '#FFB347' }
                            : { background: 'rgba(0,235,255,0.08)', border: '1px solid rgba(0,235,255,0.25)', color: '#00EBFF' }}>
                          {saveStatus[`${u.id}-admin`] === 'saving'
                            ? <div className="w-3 h-3 rounded-full border-2 animate-spin" style={{ borderColor: 'currentColor', borderTopColor: 'transparent' }} />
                            : null}
                          {u.is_admin ? 'Remove Admin' : 'Make Admin'}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          disabled={u.id === profile?.id}
                          className="px-3 py-1 rounded text-sm disabled:opacity-40"
                          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444' }}>
                          Delete
                        </button>
                      </div>
                    </div>

                    {/* Balances */}
                    <div className="border-t pt-4" style={{ borderColor: 'rgba(85,78,78,0.4)' }}>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold" style={{ color: '#F5F5F0' }}>Asset Balances</span>
                        <span className="text-xs" style={{ color: '#C0B8B8' }}>Edit & blur to save · +/− to adjust</span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {(['BTC','ETH','USDC','USDT','XRP','SOL'] as const).map(coin => {
                          const field = `${coin.toLowerCase()}_balance` as keyof Profile;
                          const bal   = (u[field] as number) || 0;
                          const key   = `${u.id}-${field}`;
                          const st    = saveStatus[key];
                          return (
                            <div key={coin} className="rounded-lg p-3"
                              style={{ background: '#1a1414', border: `1px solid ${st === 'saved' ? 'rgba(74,222,128,0.4)' : st === 'error' ? 'rgba(239,68,68,0.4)' : 'rgba(85,78,78,0.3)'}`, transition: 'border-color 0.3s' }}>
                              <div className="flex items-center justify-between mb-2">
                                <label className="text-xs font-bold" style={{ color: '#00EBFF' }}>{coin}</label>
                                {st === 'saving' && (
                                  <div className="w-3 h-3 rounded-full border-2 animate-spin"
                                    style={{ borderColor: '#00EBFF', borderTopColor: 'transparent' }} />
                                )}
                                {st === 'saved' && <CheckCircle className="w-3.5 h-3.5" style={{ color: '#4ADE80' }} />}
                                {st === 'error'  && <AlertCircle className="w-3.5 h-3.5" style={{ color: '#EF4444' }} />}
                              </div>
                              <input
                                type="number" step="0.01"
                                defaultValue={bal}
                                key={`${u.id}-${field}-${bal}`}
                                onBlur={e => handleUpdateUserBalance(u.id, field as string, parseFloat(e.target.value) || 0)}
                                className="w-full px-2 py-1.5 rounded text-sm mb-2 focus:outline-none"
                                style={{ background: '#0d0a0a', border: '1px solid rgba(0,235,255,0.2)', color: '#F5F5F0' }}
                              />
                              <div className="grid grid-cols-5 gap-1">
                                {[-100, -10, 10, 100].map(adj => (
                                  <button key={adj}
                                    onClick={() => handleAdjustBalance(u.id, field as string, bal, adj)}
                                    className="py-1 rounded text-xs col-span-1"
                                    style={adj < 0
                                      ? { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#EF4444' }
                                      : { background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.25)', color: '#4ADE80' }}>
                                    {adj > 0 ? `+${adj}` : adj}
                                  </button>
                                ))}
                                <button
                                  onClick={() => handleUpdateUserBalance(u.id, field as string, 0)}
                                  className="py-1 rounded text-xs col-span-1"
                                  style={{ background: 'rgba(156,163,175,0.08)', border: '1px solid rgba(156,163,175,0.2)', color: '#9CA3AF' }}>
                                  0
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))
              }
            </div>
          )}

          {/* ── DEPOSITS ─────────────────────────────────────────────────── */}
          {tab === 'deposits' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-semibold" style={{ color: '#F5F5F0' }}>Deposit Requests</h2>
                <span className="text-sm" style={{ color: '#C0B8B8' }}>{deposits.length} total · {pendingDeposits.length} pending</span>
              </div>
              {deposits.length === 0
                ? <div className="text-center py-12" style={{ color: '#C0B8B8' }}>No deposit requests yet</div>
                : deposits.map(dep => {
                  const owner = users.find(u => u.id === dep.user_id);
                  return (
                    <div key={dep.id} className="rounded-xl p-5"
                      style={{ background: '#0d0a0a', border: `1px solid ${dep.status === 'pending' ? 'rgba(0,235,255,0.25)' : 'rgba(85,78,78,0.3)'}` }}>
                      <div className="flex flex-wrap justify-between items-start gap-3 mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg font-bold" style={{ color: '#F5F5F0' }}>{dep.amount} USDT</span>
                            <span className="px-2 py-0.5 rounded text-xs font-bold"
                              style={{
                                background: dep.status === 'approved' ? 'rgba(74,222,128,0.1)' : dep.status === 'rejected' ? 'rgba(239,68,68,0.1)' : 'rgba(251,191,36,0.1)',
                                color: dep.status === 'approved' ? '#4ADE80' : dep.status === 'rejected' ? '#EF4444' : '#FBbf24',
                              }}>
                              {dep.status.toUpperCase()}
                            </span>
                          </div>
                          <div className="text-sm" style={{ color: '#C0B8B8' }}>
                            Network: <span style={{ color: '#00EBFF' }}>{dep.network}</span>
                          </div>
                          <div className="text-xs mt-1" style={{ color: '#C0B8B8' }}>
                            User: {owner?.username || dep.user_id.slice(0, 16)}…
                          </div>
                          <div className="text-xs" style={{ color: '#C0B8B8' }}>
                            {new Date(dep.created_at).toLocaleString()}
                          </div>
                        </div>
                        {dep.status === 'pending' && (
                          <div className="flex gap-2">
                            <button onClick={() => handleDepositAction(dep.id, 'approved')}
                              className="px-4 py-2 rounded-lg text-sm font-semibold"
                              style={{ background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.4)', color: '#4ADE80' }}>
                              Approve
                            </button>
                            <button onClick={() => handleDepositAction(dep.id, 'rejected')}
                              className="px-4 py-2 rounded-lg text-sm font-semibold"
                              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444' }}>
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                      {dep.proof_url && (
                        <div className="mt-3">
                          <p className="text-xs mb-2" style={{ color: '#7A8899' }}>Payment Proof:</p>
                          <div className="relative inline-block">
                            <img
                              src={dep.proof_url}
                              alt="Payment proof"
                              className="max-h-40 rounded-xl object-contain cursor-pointer transition-all hover:opacity-90"
                              style={{ border: '1px solid rgba(0,235,255,0.25)', maxWidth: '100%' }}
                              onClick={() => setLightboxUrl(dep.proof_url!)}
                              onError={e => {
                                (e.target as HTMLImageElement).style.display = 'none';
                                (e.target as HTMLImageElement).nextElementSibling?.removeAttribute('style');
                              }}
                            />
                            <button
                              onClick={() => setLightboxUrl(dep.proof_url!)}
                              className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium"
                              style={{ background: 'rgba(0,0,0,0.65)', color: '#00EBFF', border: '1px solid rgba(0,235,255,0.3)' }}>
                              <ZoomIn className="w-3 h-3" /> View
                            </button>
                          </div>
                          {/* Fallback link if image fails to load */}
                          <a href={dep.proof_url} target="_blank" rel="noopener noreferrer"
                            className="text-xs underline mt-1 block" style={{ color: '#00EBFF', display: 'none' }}>
                            Open proof in new tab
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })
              }
            </div>
          )}

          {/* ── WITHDRAWALS ──────────────────────────────────────────────── */}
          {tab === 'withdrawals' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-semibold" style={{ color: '#F5F5F0' }}>Withdrawal Requests</h2>
                <span className="text-sm" style={{ color: '#C0B8B8' }}>{withdrawals.length} total · {pendingWithdrawals.length} pending</span>
              </div>
              {withdrawals.length === 0
                ? <div className="text-center py-12" style={{ color: '#C0B8B8' }}>No withdrawal requests yet</div>
                : withdrawals.map(wd => {
                  const owner = users.find(u => u.id === wd.user_id);
                  return (
                    <div key={wd.id} className="rounded-xl p-5"
                      style={{ background: '#0d0a0a', border: `1px solid ${wd.status === 'pending' ? 'rgba(0,235,255,0.25)' : 'rgba(85,78,78,0.3)'}` }}>
                      <div className="flex flex-wrap justify-between items-start gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg font-bold" style={{ color: '#F5F5F0' }}>{wd.amount} {wd.currency}</span>
                            <span className="px-2 py-0.5 rounded text-xs font-bold"
                              style={{
                                background: wd.status === 'approved' ? 'rgba(74,222,128,0.1)' : wd.status === 'rejected' ? 'rgba(239,68,68,0.1)' : 'rgba(251,191,36,0.1)',
                                color: wd.status === 'approved' ? '#4ADE80' : wd.status === 'rejected' ? '#EF4444' : '#FBbf24',
                              }}>
                              {wd.status.toUpperCase()}
                            </span>
                          </div>
                          <div className="text-sm break-all" style={{ color: '#C0B8B8' }}>To: {wd.wallet_address}</div>
                          <div className="text-xs mt-1" style={{ color: '#C0B8B8' }}>
                            User: {owner?.username || wd.user_id.slice(0, 16)}…
                          </div>
                          <div className="text-xs" style={{ color: '#C0B8B8' }}>
                            {new Date(wd.created_at).toLocaleString()}
                          </div>
                        </div>
                        {wd.status === 'pending' && (
                          <div className="flex gap-2">
                            <button onClick={() => handleWithdrawalAction(wd.id, 'approved')}
                              className="px-4 py-2 rounded-lg text-sm font-semibold"
                              style={{ background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.4)', color: '#4ADE80' }}>
                              Approve
                            </button>
                            <button onClick={() => handleWithdrawalAction(wd.id, 'rejected')}
                              className="px-4 py-2 rounded-lg text-sm font-semibold"
                              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444' }}>
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              }
            </div>
          )}

          {/* ── KYC ──────────────────────────────────────────────────────── */}
          {tab === 'kyc' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-semibold" style={{ color: '#F5F5F0' }}>KYC Verification</h2>
                <span className="text-sm" style={{ color: '#C0B8B8' }}>{kyc.length} total · {pendingKYC.length} pending</span>
              </div>
              {kyc.length === 0
                ? <div className="text-center py-12" style={{ color: '#C0B8B8' }}>No KYC submissions yet</div>
                : kyc.map(k => {
                  const owner = users.find(u => u.id === k.user_id);
                  return (
                    <div key={k.id} className="rounded-xl p-5"
                      style={{ background: '#0d0a0a', border: `1px solid ${k.status === 'pending' ? 'rgba(0,235,255,0.25)' : 'rgba(85,78,78,0.3)'}` }}>
                      <div className="flex flex-wrap justify-between gap-4 mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-bold text-lg" style={{ color: '#F5F5F0' }}>{k.full_name}</span>
                            <span className="px-2 py-0.5 rounded text-xs font-bold"
                              style={{
                                background: k.status === 'approved' ? 'rgba(74,222,128,0.1)' : k.status === 'rejected' ? 'rgba(239,68,68,0.1)' : 'rgba(251,191,36,0.1)',
                                color: k.status === 'approved' ? '#4ADE80' : k.status === 'rejected' ? '#EF4444' : '#FBbf24',
                              }}>
                              {k.status.toUpperCase()}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                            <div><span style={{ color: '#C0B8B8' }}>Account:</span> <span style={{ color: '#F5F5F0' }}>{owner?.username || '—'}</span></div>
                            <div><span style={{ color: '#C0B8B8' }}>Phone:</span>   <span style={{ color: '#F5F5F0' }}>{k.phone_number}</span></div>
                            <div><span style={{ color: '#C0B8B8' }}>Country:</span> <span style={{ color: '#F5F5F0' }}>{k.country}</span></div>
                            <div><span style={{ color: '#C0B8B8' }}>ID No:</span>   <span style={{ color: '#F5F5F0' }}>{k.id_number}</span></div>
                            <div className="col-span-2"><span style={{ color: '#C0B8B8' }}>Address:</span> <span style={{ color: '#F5F5F0' }}>{k.full_address}</span></div>
                            <div className="col-span-2 text-xs" style={{ color: '#C0B8B8' }}>{new Date(k.created_at).toLocaleString()}</div>
                          </div>
                        </div>
                        {k.status === 'pending' && (
                          <div className="flex flex-col gap-2">
                            <button onClick={() => handleKYCAction(k.id, 'approved')}
                              className="px-5 py-2 rounded-lg text-sm font-semibold"
                              style={{ background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.4)', color: '#4ADE80' }}>
                              Approve
                            </button>
                            <button onClick={() => handleKYCAction(k.id, 'rejected')}
                              className="px-5 py-2 rounded-lg text-sm font-semibold"
                              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444' }}>
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                      {(k.id_front_photo_url || k.id_back_photo_url) && (
                        <div className="mt-2">
                          <p className="text-xs mb-2" style={{ color: '#C0B8B8' }}>ID Photos:</p>
                          <div className="flex flex-wrap gap-4">
                            {[{ label: 'Front ID', url: k.id_front_photo_url }, { label: 'Back ID', url: k.id_back_photo_url }]
                              .map(({ label, url }) => url ? (
                                <div key={label}>
                                  <p className="text-xs mb-1" style={{ color: '#C0B8B8' }}>{label}</p>
                                  {url.startsWith('data:image')
                                    ? <img src={url} alt={label} className="w-48 h-32 object-cover rounded-lg"
                                        style={{ border: '1px solid rgba(0,235,255,0.2)' }} />
                                    : <a href={url} target="_blank" rel="noopener noreferrer"
                                        className="text-sm underline" style={{ color: '#00EBFF' }}>{label}</a>
                                  }
                                </div>
                              ) : null)
                            }
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              }
            </div>
          )}

          {/* ── TRADE RESULTS ────────────────────────────────────────────── */}
          {tab === 'traderesult' && (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-semibold" style={{ color: '#F5F5F0' }}>User Trade Results</h2>
                <p className="text-xs mt-1" style={{ color: '#C0B8B8' }}>
                  Set the forced outcome for each user's <strong style={{ color: '#F5F5F0' }}>next trade</strong>, and edit the result of any existing trade.
                </p>
              </div>

              {users.length === 0
                ? <div className="text-center py-12" style={{ color: '#C0B8B8' }}>No users yet</div>
                : users.map(u => {
                  const userTrades = trades.filter(t => t.user_id === u.id);
                  const forcedResult = (u.forced_result ?? null) as 'win' | 'loss' | null;
                  const isExpanded = expandedUser === u.id;
                  const forcedKey = `${u.id}-forced`;
                  const forcedSt  = saveStatus[forcedKey];

                  return (
                    <div
                      key={u.id}
                      className="mb-3 rounded-xl overflow-hidden"
                      style={{ border: `1px solid ${forcedResult === 'win' ? 'rgba(74,222,128,0.35)' : forcedResult === 'loss' ? 'rgba(239,68,68,0.35)' : 'rgba(85,78,78,0.35)'}`, background: '#0d0a0a' }}
                    >
                      {/* User header row */}
                      <div className="flex flex-wrap items-center gap-3 px-4 py-3">
                        {/* Identity */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm" style={{ color: '#F5F5F0' }}>{u.username || 'Unnamed'}</span>
                            <span className="text-xs font-mono" style={{ color: '#6B6363' }}>{u.id.slice(0, 12)}…</span>
                            <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(0,235,255,0.08)', color: '#C0B8B8' }}>
                              {userTrades.length} trade{userTrades.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>

                        {/* Forced result control */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs" style={{ color: '#7A7070' }}>Trade Mode:</span>
                          <div className="flex gap-1.5">
                            {/* Win */}
                            <button
                              onClick={() => handleSetForcedResult(u.id, 'win')}
                              disabled={forcedSt === 'saving'}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                              style={forcedResult === 'win'
                                ? { background: 'rgba(74,222,128,0.2)', border: '1px solid rgba(74,222,128,0.6)', color: '#4ADE80', boxShadow: '0 0 12px rgba(74,222,128,0.25)' }
                                : { background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.2)', color: '#7A7070' }
                              }
                            >
                              <Trophy className="w-3 h-3" />
                              WIN
                            </button>
                            {/* Loss */}
                            <button
                              onClick={() => handleSetForcedResult(u.id, 'loss')}
                              disabled={forcedSt === 'saving'}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                              style={forcedResult === 'loss'
                                ? { background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.6)', color: '#EF4444', boxShadow: '0 0 12px rgba(239,68,68,0.25)' }
                                : { background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', color: '#7A7070' }
                              }
                            >
                              <TrendingDown className="w-3 h-3" />
                              LOSS
                            </button>
                            {/* Random (clear) */}
                            <button
                              onClick={() => handleSetForcedResult(u.id, null)}
                              disabled={forcedSt === 'saving' || forcedResult === null}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-30"
                              style={forcedResult === null
                                ? { background: 'rgba(156,163,175,0.15)', border: '1px solid rgba(156,163,175,0.4)', color: '#9CA3AF' }
                                : { background: 'rgba(156,163,175,0.06)', border: '1px solid rgba(156,163,175,0.2)', color: '#6B7280' }
                              }
                              title="Random — trades resolve by chance"
                            >
                              RANDOM
                            </button>
                          </div>
                          {/* Save indicator */}
                          {forcedSt === 'saving' && <div className="w-3.5 h-3.5 rounded-full border-2 animate-spin flex-shrink-0" style={{ borderColor: '#00EBFF', borderTopColor: 'transparent' }} />}
                          {forcedSt === 'saved'  && <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#4ADE80' }} />}
                          {forcedSt === 'error'  && <span className="text-xs" style={{ color: '#EF4444' }}>Run Step 6 SQL first</span>}
                        </div>

                        {/* Expand trades toggle */}
                        {userTrades.length > 0 && (
                          <button
                            onClick={() => setExpandedUser(isExpanded ? null : u.id)}
                            className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs transition-all"
                            style={{ background: 'rgba(0,235,255,0.06)', border: '1px solid rgba(0,235,255,0.15)', color: '#00EBFF' }}
                          >
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            Trades
                          </button>
                        )}
                      </div>

                      {/* Forced result banner */}
                      {forcedResult && (
                        <div
                          className="mx-4 mb-3 px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2"
                          style={forcedResult === 'win'
                            ? { background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', color: '#4ADE80' }
                            : { background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444' }
                          }
                        >
                          {forcedResult === 'win' ? <Trophy className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                          All trades forced to <strong>{forcedResult.toUpperCase()}</strong> — persists until you set RANDOM
                        </div>
                      )}

                      {/* Trade history */}
                      {isExpanded && userTrades.length > 0 && (
                        <div className="border-t px-4 py-3 space-y-2" style={{ borderColor: 'rgba(85,78,78,0.3)' }}>
                          <div className="text-xs font-semibold mb-2" style={{ color: '#7A7070' }}>TRADE HISTORY — click WIN/LOSS to override outcome</div>

                          {/* Column headers */}
                          <div className="hidden md:grid grid-cols-12 gap-2 text-xs mb-1 px-2" style={{ color: '#6B6363' }}>
                            <div className="col-span-2">Date</div>
                            <div className="col-span-1">Type</div>
                            <div className="col-span-1">Amount</div>
                            <div className="col-span-2">Duration</div>
                            <div className="col-span-2">Outcome</div>
                            <div className="col-span-2">P&amp;L</div>
                            <div className="col-span-2">Override</div>
                          </div>

                          {userTrades.slice(0, 20).map(trade => {
                            const tKey = `trade-outcome-${trade.id}`;
                            const tSt  = saveStatus[tKey];
                            const isWin  = trade.outcome === 'win';
                            const isLoss = trade.outcome === 'loss';
                            const isPending = !trade.outcome || trade.outcome === 'pending';
                            const durLabel = tradeSettings.find(s => s.duration === trade.duration)?.label ?? `${trade.duration}s`;

                            return (
                              <div
                                key={trade.id}
                                className="grid grid-cols-2 md:grid-cols-12 gap-2 items-center px-2 py-2 rounded-lg"
                                style={{ background: isWin ? 'rgba(74,222,128,0.04)' : isLoss ? 'rgba(239,68,68,0.04)' : 'rgba(0,235,255,0.03)', border: `1px solid ${isWin ? 'rgba(74,222,128,0.15)' : isLoss ? 'rgba(239,68,68,0.15)' : 'rgba(85,78,78,0.2)'}` }}
                              >
                                <div className="col-span-1 md:col-span-2 text-xs" style={{ color: '#7A7070' }}>
                                  {new Date(trade.created_at).toLocaleDateString()}
                                </div>
                                <div className="col-span-1 md:col-span-1 text-xs font-medium" style={{ color: '#C0B8B8' }}>
                                  {trade.trade_type || '—'}
                                </div>
                                <div className="col-span-1 md:col-span-1 text-xs font-bold" style={{ color: '#F5F5F0' }}>
                                  ${(trade.amount || 0).toFixed(2)}
                                </div>
                                <div className="col-span-1 md:col-span-2 text-xs" style={{ color: '#C0B8B8' }}>
                                  {durLabel}
                                </div>
                                <div className="col-span-1 md:col-span-2">
                                  <span
                                    className="px-2 py-0.5 rounded text-xs font-bold"
                                    style={{
                                      background: isWin ? 'rgba(74,222,128,0.12)' : isLoss ? 'rgba(239,68,68,0.12)' : 'rgba(251,191,36,0.12)',
                                      color: isWin ? '#4ADE80' : isLoss ? '#EF4444' : '#FBbf24',
                                    }}
                                  >
                                    {isPending ? 'PENDING' : (trade.outcome ?? '—').toUpperCase()}
                                  </span>
                                </div>
                                <div className="col-span-1 md:col-span-2 text-xs font-bold"
                                  style={{ color: (trade.profit_loss ?? 0) >= 0 ? '#4ADE80' : '#EF4444' }}>
                                  {trade.profit_loss != null
                                    ? `${trade.profit_loss >= 0 ? '+' : ''}$${trade.profit_loss.toFixed(2)}`
                                    : '—'}
                                </div>
                                {/* Override buttons */}
                                <div className="col-span-2 md:col-span-2 flex items-center gap-1.5">
                                  <button
                                    onClick={() => handleOverrideTrade(trade.id, 'win')}
                                    disabled={tSt === 'saving'}
                                    className="flex items-center gap-1 px-2 py-1 rounded text-xs font-bold transition-all disabled:opacity-40"
                                    style={isWin
                                      ? { background: 'rgba(74,222,128,0.18)', border: '1px solid rgba(74,222,128,0.5)', color: '#4ADE80' }
                                      : { background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.18)', color: '#6B6363' }
                                    }
                                  >
                                    <Trophy className="w-3 h-3" /> W
                                  </button>
                                  <button
                                    onClick={() => handleOverrideTrade(trade.id, 'loss')}
                                    disabled={tSt === 'saving'}
                                    className="flex items-center gap-1 px-2 py-1 rounded text-xs font-bold transition-all disabled:opacity-40"
                                    style={isLoss
                                      ? { background: 'rgba(239,68,68,0.18)', border: '1px solid rgba(239,68,68,0.5)', color: '#EF4444' }
                                      : { background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.18)', color: '#6B6363' }
                                    }
                                  >
                                    <TrendingDown className="w-3 h-3" /> L
                                  </button>
                                  {tSt === 'saving' && <div className="w-3 h-3 rounded-full border-2 animate-spin" style={{ borderColor: '#00EBFF', borderTopColor: 'transparent' }} />}
                                  {tSt === 'saved'  && <CheckCircle className="w-3 h-3" style={{ color: '#4ADE80' }} />}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              }

              <div className="mt-6 p-4 rounded-xl" style={{ background: '#0d0a0a', border: '1px solid rgba(0,235,255,0.08)' }}>
                <p className="font-semibold text-sm mb-2" style={{ color: '#F5F5F0' }}>How trade mode works</p>
                <ul className="space-y-1 text-xs" style={{ color: '#C0B8B8' }}>
                  <li>• <strong style={{ color: '#4ADE80' }}>WIN</strong> — every trade this user places will always win, until changed</li>
                  <li>• <strong style={{ color: '#EF4444' }}>LOSS</strong> — every trade this user places will always lose, until changed</li>
                  <li>• <strong style={{ color: '#9CA3AF' }}>RANDOM</strong> — trades resolve by chance (default behaviour)</li>
                  <li>• The mode persists across all trades until you manually change it here</li>
                  <li>• The <strong style={{ color: '#F5F5F0' }}>Trade History</strong> section lets you retroactively change the W/L of any completed trade and recalculate P&amp;L</li>
                  <li>• Requires the <code style={{ color: '#00EBFF' }}>get_forced_result</code> SQL function to be deployed in Supabase</li>
                </ul>
              </div>
            </div>
          )}

          {/* ── TRADE CONFIG ─────────────────────────────────────────────── */}
          {tab === 'trade' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold" style={{ color: '#F5F5F0' }}>Trade Duration Settings</h2>
                  <p className="text-xs mt-1" style={{ color: '#C0B8B8' }}>
                    Configure each trade duration — min/max capital, win/loss %, and enable or disable it for users.
                  </p>
                </div>
                <button
                  onClick={handleAddTradeSetting}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium"
                  style={{ background: 'rgba(0,235,255,0.1)', border: '1px solid rgba(0,235,255,0.3)', color: '#00EBFF' }}
                >
                  <Plus className="w-4 h-4" /> Add Duration
                </button>
              </div>

              {/* Column headers */}
              <div className="hidden md:grid grid-cols-12 gap-3 px-4 mb-2 text-xs font-semibold uppercase tracking-wider"
                style={{ color: '#7A7070' }}>
                <div className="col-span-2">Duration</div>
                <div className="col-span-2">Label</div>
                <div className="col-span-1">Min $</div>
                <div className="col-span-1">Max $</div>
                <div className="col-span-1">Win %</div>
                <div className="col-span-1">Loss %</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2">Actions</div>
              </div>

              <div className="space-y-3">
                {tradeSettings.map(row => {
                  const key = `trade-${row.duration}`;
                  const st  = saveStatus[key];
                  return (
                    <div
                      key={row.duration}
                      className="rounded-xl p-4 transition-all duration-300"
                      style={{
                        background: '#0d0a0a',
                        border: `1px solid ${
                          st === 'saved'  ? 'rgba(74,222,128,0.4)'  :
                          st === 'error'  ? 'rgba(239,68,68,0.4)'   :
                          row.is_enabled  ? 'rgba(0,235,255,0.2)'   :
                                            'rgba(85,78,78,0.35)'
                        }`,
                      }}
                    >
                      {/* Mobile label + toggle */}
                      <div className="flex items-center justify-between mb-3 md:hidden">
                        <span className="font-semibold" style={{ color: row.is_enabled ? '#00EBFF' : '#7A7070' }}>
                          {row.label}
                        </span>
                        <button onClick={() => handleToggleDuration(row.duration, row.is_enabled)}>
                          {row.is_enabled
                            ? <ToggleRight className="w-7 h-7" style={{ color: '#00EBFF' }} />
                            : <ToggleLeft  className="w-7 h-7" style={{ color: '#7A7070' }} />
                          }
                        </button>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-12 gap-3 items-center">
                        {/* Duration (read-only) */}
                        <div className="col-span-1 md:col-span-2">
                          <div className="hidden md:block text-xs mb-1" style={{ color: '#7A7070' }}>Seconds</div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 flex-shrink-0" style={{ color: row.is_enabled ? '#00EBFF' : '#7A7070' }} />
                            <span className="text-sm font-mono font-bold" style={{ color: row.is_enabled ? '#00EBFF' : '#C0B8B8' }}>
                              {row.duration}s
                            </span>
                          </div>
                        </div>

                        {/* Label */}
                        <div className="col-span-1 md:col-span-2">
                          <div className="hidden md:block text-xs mb-1" style={{ color: '#7A7070' }}>Label</div>
                          <input
                            type="text"
                            value={row.label}
                            onChange={e => handleTradeFieldChange(row.duration, 'label', e.target.value)}
                            onBlur={() => handleSaveTradeSetting(row)}
                            className="w-full px-2 py-1.5 rounded text-sm focus:outline-none"
                            style={{ background: '#1a1414', border: '1px solid rgba(0,235,255,0.15)', color: '#F5F5F0' }}
                          />
                        </div>

                        {/* Min capital */}
                        <div className="col-span-1 md:col-span-1">
                          <div className="hidden md:block text-xs mb-1" style={{ color: '#7A7070' }}>Min $</div>
                          <input
                            type="number" min={0}
                            value={row.min_capital}
                            onChange={e => handleTradeFieldChange(row.duration, 'min_capital', parseFloat(e.target.value) || 0)}
                            onBlur={() => handleSaveTradeSetting(row)}
                            className="w-full px-2 py-1.5 rounded text-sm focus:outline-none"
                            style={{ background: '#1a1414', border: '1px solid rgba(0,235,255,0.15)', color: '#F5F5F0' }}
                          />
                        </div>

                        {/* Max capital */}
                        <div className="col-span-1 md:col-span-1">
                          <div className="hidden md:block text-xs mb-1" style={{ color: '#7A7070' }}>Max $</div>
                          <input
                            type="number" min={0}
                            value={row.max_capital}
                            onChange={e => handleTradeFieldChange(row.duration, 'max_capital', parseFloat(e.target.value) || 0)}
                            onBlur={() => handleSaveTradeSetting(row)}
                            className="w-full px-2 py-1.5 rounded text-sm focus:outline-none"
                            style={{ background: '#1a1414', border: '1px solid rgba(0,235,255,0.15)', color: '#F5F5F0' }}
                          />
                        </div>

                        {/* Win % */}
                        <div className="col-span-1 md:col-span-1">
                          <div className="hidden md:block text-xs mb-1" style={{ color: '#7A7070' }}>Win %</div>
                          <div className="relative">
                            <input
                              type="number" min={0} max={100}
                              value={row.win_percentage}
                              onChange={e => handleTradeFieldChange(row.duration, 'win_percentage', parseFloat(e.target.value) || 0)}
                              onBlur={() => handleSaveTradeSetting(row)}
                              className="w-full pl-2 pr-6 py-1.5 rounded text-sm focus:outline-none"
                              style={{ background: '#1a1414', border: '1px solid rgba(74,222,128,0.2)', color: '#4ADE80' }}
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs" style={{ color: '#4ADE80' }}>%</span>
                          </div>
                        </div>

                        {/* Loss % */}
                        <div className="col-span-1 md:col-span-1">
                          <div className="hidden md:block text-xs mb-1" style={{ color: '#7A7070' }}>Loss %</div>
                          <div className="relative">
                            <input
                              type="number" min={0} max={100}
                              value={row.loss_percentage}
                              onChange={e => handleTradeFieldChange(row.duration, 'loss_percentage', parseFloat(e.target.value) || 0)}
                              onBlur={() => handleSaveTradeSetting(row)}
                              className="w-full pl-2 pr-6 py-1.5 rounded text-sm focus:outline-none"
                              style={{ background: '#1a1414', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444' }}
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs" style={{ color: '#EF4444' }}>%</span>
                          </div>
                        </div>

                        {/* Toggle — desktop */}
                        <div className="col-span-1 md:col-span-2 hidden md:flex items-center gap-2">
                          <button
                            onClick={() => handleToggleDuration(row.duration, row.is_enabled)}
                            className="flex items-center gap-1.5 text-sm font-medium transition-all"
                          >
                            {row.is_enabled
                              ? <ToggleRight className="w-7 h-7" style={{ color: '#00EBFF' }} />
                              : <ToggleLeft  className="w-7 h-7" style={{ color: '#7A7070' }} />
                            }
                            <span style={{ color: row.is_enabled ? '#00EBFF' : '#7A7070' }}>
                              {row.is_enabled ? 'Enabled' : 'Disabled'}
                            </span>
                          </button>
                        </div>

                        {/* Actions */}
                        <div className="col-span-2 md:col-span-2 flex items-center gap-2">
                          <button
                            onClick={() => handleSaveTradeSetting(row)}
                            disabled={st === 'saving'}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50 transition-all"
                            style={{ background: 'rgba(0,235,255,0.1)', border: '1px solid rgba(0,235,255,0.3)', color: '#00EBFF' }}
                          >
                            {st === 'saving' && <div className="w-3 h-3 rounded-full border-2 animate-spin" style={{ borderColor: '#00EBFF', borderTopColor: 'transparent' }} />}
                            {st === 'saved'  && <CheckCircle className="w-3.5 h-3.5" style={{ color: '#4ADE80' }} />}
                            {st === 'error'  && <AlertCircle className="w-3.5 h-3.5" style={{ color: '#EF4444' }} />}
                            {!st && 'Save'}
                            {st === 'saving' && 'Saving…'}
                            {st === 'saved'  && 'Saved'}
                            {st === 'error'  && 'Error'}
                          </button>
                          <button
                            onClick={() => handleDeleteTradeSetting(row.duration)}
                            className="p-1.5 rounded-lg transition-colors"
                            style={{ color: '#EF4444', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
                            title="Delete duration"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 p-4 rounded-xl text-sm" style={{ background: '#0d0a0a', border: '1px solid rgba(0,235,255,0.08)' }}>
                <p className="font-semibold mb-2" style={{ color: '#F5F5F0' }}>How it works</p>
                <ul className="space-y-1 text-xs" style={{ color: '#C0B8B8' }}>
                  <li>• <strong style={{ color: '#F5F5F0' }}>Win %</strong> — payout percentage on winning trades (e.g. 85% means a $100 trade wins $85 profit)</li>
                  <li>• <strong style={{ color: '#F5F5F0' }}>Loss %</strong> — percentage of investment lost on losing trades (100% = full investment lost)</li>
                  <li>• <strong style={{ color: '#F5F5F0' }}>Disabled</strong> durations are hidden from the trading interface</li>
                  <li>• Changes take effect immediately for all users after save</li>
                </ul>
              </div>
            </div>
          )}

          {/* ── SETTINGS ─────────────────────────────────────────────────── */}
          {tab === 'settings' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold" style={{ color: '#F5F5F0' }}>Platform Settings</h2>

              {/* Platform stats */}
              <div className="rounded-xl p-6" style={{ background: '#0d0a0a', border: '1px solid rgba(0,235,255,0.12)' }}>
                <h3 className="text-sm font-bold mb-4" style={{ color: '#C0B8B8' }}>Platform Info</h3>
                <div className="space-y-3 text-sm">
                  {[
                    { label: 'Backend',          value: 'Supabase (live)' },
                    { label: 'Project',          value: 'xwtnkxvvxozgjddwrvon' },
                    { label: 'Total Users',      value: String(stats.totalUsers) },
                    { label: 'Verified Users',   value: String(stats.verifiedUsers) },
                    { label: 'Platform Balance', value: `$${stats.platformBalance.toFixed(2)}` },
                  ].map(row => (
                    <div key={row.label} className="flex justify-between py-2 border-b"
                      style={{ borderColor: 'rgba(85,78,78,0.3)' }}>
                      <span style={{ color: '#C0B8B8' }}>{row.label}</span>
                      <span className="font-medium" style={{ color: '#00EBFF' }}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* QR Code Upload */}
              <div className="rounded-xl p-6" style={{ background: '#0d0a0a', border: '1px solid rgba(0,235,255,0.12)' }}>
                <h3 className="text-sm font-bold mb-1" style={{ color: '#C0B8B8' }}>Deposit QR Codes</h3>
                <p className="text-xs mb-5" style={{ color: '#5A6677' }}>
                  Upload custom QR code images for each deposit network. These replace the default images shown to users.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {([
                    { key: 'TRC20', label: 'USDT TRC20',    color: '#26A17B' },
                    { key: 'ERC20', label: 'USDT ERC20',    color: '#26A17B' },
                    { key: 'ETH',   label: 'ETH',            color: '#627EEA' },
                    { key: 'BTC',   label: 'BTC',            color: '#F7931A' },
                    { key: 'USDC',  label: 'USDC',           color: '#2775CA' },
                  ] as const).map(net => {
                    const currentQr = qrUrls[net.key];
                    const isUploading = qrUploading === net.key;
                    return (
                      <div key={net.key} className="rounded-xl p-4 flex flex-col gap-3"
                        style={{ background: '#140f0f', border: '1px solid rgba(85,78,78,0.3)' }}>
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: net.color }} />
                          <span className="text-sm font-bold" style={{ color: '#F5F5F0' }}>{net.label}</span>
                        </div>

                        {/* QR preview */}
                        <div className="flex justify-center">
                          {currentQr ? (
                            <div className="relative">
                              <img src={currentQr} alt={`${net.label} QR`}
                                className="w-28 h-28 object-contain rounded-lg cursor-pointer"
                                style={{ background: '#fff', border: '2px solid rgba(0,235,255,0.3)', padding: 4 }}
                                onClick={() => setLightboxUrl(currentQr)} />
                              <button onClick={() => setLightboxUrl(currentQr)}
                                className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
                                style={{ background: '#00EBFF' }}>
                                <ZoomIn className="w-3 h-3" style={{ color: '#080808' }} />
                              </button>
                            </div>
                          ) : (
                            <div className="w-28 h-28 rounded-lg flex flex-col items-center justify-center gap-1"
                              style={{ background: 'rgba(255,255,255,0.03)', border: '2px dashed rgba(85,78,78,0.4)' }}>
                              <Upload className="w-6 h-6" style={{ color: '#5A6677' }} />
                              <span className="text-xs" style={{ color: '#5A6677' }}>No QR uploaded</span>
                            </div>
                          )}
                        </div>

                        {/* Upload button */}
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          className="hidden"
                          ref={el => { qrInputRefs.current[net.key] = el; }}
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) handleQrUpload(net.key, file);
                            e.target.value = '';
                          }}
                        />
                        <button
                          onClick={() => qrInputRefs.current[net.key]?.click()}
                          disabled={isUploading}
                          className="w-full py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                          style={{ background: 'rgba(0,235,255,0.1)', border: '1px solid rgba(0,235,255,0.3)', color: '#00EBFF' }}>
                          {isUploading
                            ? <><div className="w-3 h-3 border border-t-transparent rounded-full animate-spin" style={{ borderColor: '#00EBFF', borderTopColor: 'transparent' }} /> Uploading…</>
                            : <><Upload className="w-3 h-3" /> {currentQr ? 'Replace QR' : 'Upload QR'}</>
                          }
                        </button>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs mt-4" style={{ color: '#5A6677' }}>
                  * QR images are uploaded to Supabase Storage (assets bucket). Create the bucket if it doesn't exist yet.
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
