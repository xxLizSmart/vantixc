import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Profile, Deposit, Withdrawal, KYCVerification, TradeSetting, Trade } from '../lib/supabase';
import { Users, DollarSign, FileCheck, ArrowUpRight, Settings, Target, TrendingUp, Activity, AlertCircle } from 'lucide-react';

interface PlatformStats {
  totalUsers: number;
  verifiedUsers: number;
  pendingDeposits: number;
  pendingWithdrawals: number;
  pendingKYC: number;
  totalTradesToday: number;
  platformBalance: number;
}

export default function AdminPanel() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'deposits' | 'withdrawals' | 'kyc' | 'settings' | 'trades'>('users');
  const [users, setUsers] = useState<Profile[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [kycRequests, setKycRequests] = useState<KYCVerification[]>([]);
  const [tradeSettings, setTradeSettings] = useState<TradeSetting[]>([]);
  const [trades, setTrades] = useState<(Trade & { username?: string })[]>([]);
  const [tradeControl, setTradeControl] = useState<'normal' | 'win_all' | 'lose_all'>('normal');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<PlatformStats>({
    totalUsers: 0,
    verifiedUsers: 0,
    pendingDeposits: 0,
    pendingWithdrawals: 0,
    pendingKYC: 0,
    totalTradesToday: 0,
    platformBalance: 0,
  });

  useEffect(() => {
    if (profile?.is_admin) {
      loadStats();
      loadData();
    }
  }, [profile, activeTab]);

  const loadStats = async () => {
    try {
      const { data: allUsers } = await supabase.from('profiles').select('*');
      const { data: allDeposits } = await supabase.from('deposits').select('*');
      const { data: allWithdrawals } = await supabase.from('withdrawals').select('*');
      const { data: allKYC } = await supabase.from('kyc_verifications').select('*');

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { data: todayTrades } = await supabase
        .from('trades')
        .select('*')
        .gte('created_at', today.toISOString());

      const platformBalance = allUsers?.reduce((sum, user) => {
        return sum +
          (user.btc_balance || 0) +
          (user.eth_balance || 0) +
          (user.usdc_balance || 0) +
          (user.usdt_balance || 0) +
          (user.xrp_balance || 0) +
          (user.sol_balance || 0);
      }, 0) || 0;

      setStats({
        totalUsers: allUsers?.length || 0,
        verifiedUsers: allUsers?.filter(u => u.kyc_status === 'verified').length || 0,
        pendingDeposits: allDeposits?.filter(d => d.status === 'pending').length || 0,
        pendingWithdrawals: allWithdrawals?.filter(w => w.status === 'pending').length || 0,
        pendingKYC: allKYC?.filter(k => k.status === 'pending').length || 0,
        totalTradesToday: todayTrades?.length || 0,
        platformBalance,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);

    if (activeTab === 'users') {
      const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (data) setUsers(data);
    } else if (activeTab === 'deposits') {
      const { data } = await supabase.from('deposits').select('*').order('created_at', { ascending: false });
      if (data) setDeposits(data);
    } else if (activeTab === 'withdrawals') {
      const { data } = await supabase.from('withdrawals').select('*').order('created_at', { ascending: false });
      if (data) setWithdrawals(data);
    } else if (activeTab === 'kyc') {
      const { data } = await supabase.from('kyc_verifications').select('*').order('created_at', { ascending: false });
      if (data) setKycRequests(data);
    } else if (activeTab === 'settings') {
      const { data } = await supabase.from('trade_settings').select('*').order('duration');
      if (data) setTradeSettings(data);
    } else if (activeTab === 'trades') {
      const { data } = await supabase
        .from('trades')
        .select('*, profiles(username)')
        .order('created_at', { ascending: false })
        .limit(50);
      if (data) {
        const formattedTrades = data.map((trade: any) => ({
          ...trade,
          username: trade.profiles?.username || 'Unknown',
        }));
        setTrades(formattedTrades);
      }
    }

    setLoading(false);
  };

  const handleDepositAction = async (id: string, status: 'approved' | 'rejected') => {
    const deposit = deposits.find((d) => d.id === id);
    if (!deposit) return;

    await supabase
      .from('deposits')
      .update({ status, reviewed_at: new Date().toISOString() })
      .eq('id', id);

    if (status === 'approved') {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('usdt_balance')
        .eq('id', deposit.user_id)
        .single();

      if (profileData) {
        await supabase
          .from('profiles')
          .update({ usdt_balance: profileData.usdt_balance + deposit.amount })
          .eq('id', deposit.user_id);

        await supabase.from('transactions').insert({
          user_id: deposit.user_id,
          type: 'deposit',
          amount: deposit.amount,
          currency: 'USDT',
          status: 'approved',
          details: { deposit_id: id },
        });
      }
    }

    loadStats();
    loadData();
  };

  const handleWithdrawalAction = async (id: string, status: 'approved' | 'rejected') => {
    const withdrawal = withdrawals.find((w) => w.id === id);
    if (!withdrawal) return;

    await supabase
      .from('withdrawals')
      .update({ status, reviewed_at: new Date().toISOString() })
      .eq('id', id);

    if (status === 'rejected') {
      const balanceField = `${withdrawal.currency.toLowerCase()}_balance`;
      const { data: profileData } = await supabase
        .from('profiles')
        .select(balanceField)
        .eq('id', withdrawal.user_id)
        .single();

      if (profileData) {
        const currentBalance = (profileData as any)[balanceField] || 0;
        await supabase
          .from('profiles')
          .update({ [balanceField]: currentBalance + withdrawal.amount })
          .eq('id', withdrawal.user_id);
      }
    }

    loadStats();
    loadData();
  };

  const handleKYCAction = async (id: string, status: 'approved' | 'rejected') => {
    const kyc = kycRequests.find((k) => k.id === id);
    if (!kyc) return;

    await supabase
      .from('kyc_verifications')
      .update({ status, reviewed_at: new Date().toISOString() })
      .eq('id', id);

    const profileStatus = status === 'approved' ? 'verified' : 'not_verified';
    await supabase
      .from('profiles')
      .update({ kyc_status: profileStatus })
      .eq('id', kyc.user_id);

    loadStats();
    loadData();
  };

  const handleUpdateTradeSetting = async (duration: number, field: 'win_percentage' | 'loss_percentage', value: number) => {
    await supabase
      .from('trade_settings')
      .update({ [field]: value })
      .eq('duration', duration);

    loadData();
  };

  const handleUpdateUserBalance = async (userId: string, field: string, value: number) => {
    await supabase
      .from('profiles')
      .update({ [field]: value })
      .eq('id', userId);

    loadData();
    loadStats();
  };

  const handleAdjustBalance = async (userId: string, field: string, currentValue: number, adjustment: number) => {
    const newValue = Math.max(0, currentValue + adjustment);
    await supabase
      .from('profiles')
      .update({ [field]: newValue })
      .eq('id', userId);

    loadData();
    loadStats();
  };

  const handleToggleAdmin = async (userId: string, currentStatus: boolean) => {
    if (userId === profile?.id) {
      alert("You cannot change your own admin status");
      return;
    }

    await supabase
      .from('profiles')
      .update({ is_admin: !currentStatus })
      .eq('id', userId);

    loadStats();
    loadData();
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === profile?.id) {
      alert("You cannot delete your own account");
      return;
    }

    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    await supabase.from('trades').delete().eq('user_id', userId);
    await supabase.from('transactions').delete().eq('user_id', userId);
    await supabase.from('deposits').delete().eq('user_id', userId);
    await supabase.from('withdrawals').delete().eq('user_id', userId);
    await supabase.from('kyc_verifications').delete().eq('user_id', userId);
    await supabase.from('profiles').delete().eq('id', userId);

    loadStats();
    loadData();
  };

  const handleUpdateKYCStatus = async (userId: string, status: 'not_verified' | 'pending' | 'verified') => {
    await supabase
      .from('profiles')
      .update({ kyc_status: status })
      .eq('id', userId);

    loadData();
  };

  if (!profile?.is_admin) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="text-white text-xl">Access Denied</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] py-8 px-4 pb-20">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Admin Panel</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#0f0f0f] rounded-lg p-6 border border-teal-900/30">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-400 text-sm">Total Users</h3>
              <Users className="w-5 h-5 text-teal-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-2">{stats.totalUsers}</div>
            <div className="text-green-500 text-sm">
              {stats.verifiedUsers} verified
            </div>
          </div>

          <div className="bg-[#0f0f0f] rounded-lg p-6 border border-teal-900/30">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-400 text-sm">Platform Balance</h3>
              <TrendingUp className="w-5 h-5 text-teal-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-2">
              ${stats.platformBalance.toFixed(2)}
            </div>
            <div className="text-gray-400 text-sm">
              Total assets
            </div>
          </div>

          <div className="bg-[#0f0f0f] rounded-lg p-6 border border-teal-900/30">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-400 text-sm">Trades Today</h3>
              <Activity className="w-5 h-5 text-teal-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-2">{stats.totalTradesToday}</div>
            <div className="text-gray-400 text-sm">
              Active trading
            </div>
          </div>

          <div className="bg-[#0f0f0f] rounded-lg p-6 border border-teal-900/30">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-400 text-sm">Pending Actions</h3>
              <AlertCircle className="w-5 h-5 text-yellow-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-2">
              {stats.pendingDeposits + stats.pendingWithdrawals + stats.pendingKYC}
            </div>
            <div className="text-yellow-400 text-sm">
              {stats.pendingDeposits} deposits, {stats.pendingWithdrawals} withdrawals, {stats.pendingKYC} KYC
            </div>
          </div>
        </div>

        <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: 'users', label: 'Users', icon: Users },
            { id: 'trades', label: 'Trades', icon: Target },
            { id: 'deposits', label: 'Deposits', icon: DollarSign },
            { id: 'withdrawals', label: 'Withdrawals', icon: ArrowUpRight },
            { id: 'kyc', label: 'KYC', icon: FileCheck },
            { id: 'settings', label: 'Settings', icon: Settings },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-teal-600 text-white'
                  : 'bg-[#0f0f0f] text-gray-400 hover:bg-teal-900/30'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="bg-[#0f0f0f] rounded-lg p-6 border border-teal-900/30">
          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading...</div>
          ) : (
            <>
              {activeTab === 'users' && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-white mb-4">User Management</h2>
                  {users.map((user) => (
                    <div key={user.id} className="bg-[#1a1a1a] rounded-lg p-4 border border-teal-900/30">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="text-white font-semibold text-lg">
                              {user.username || 'No username'}
                            </div>
                            {user.is_admin && (
                              <span className="px-2 py-1 bg-yellow-900/30 border border-yellow-600/30 text-yellow-400 text-xs rounded">
                                ADMIN
                              </span>
                            )}
                            <span className={`px-2 py-1 text-xs rounded ${
                              user.kyc_status === 'verified' ? 'bg-green-900/30 border border-green-600/30 text-green-400' :
                              user.kyc_status === 'pending' ? 'bg-yellow-900/30 border border-yellow-600/30 text-yellow-400' :
                              'bg-gray-900/30 border border-gray-600/30 text-gray-400'
                            }`}>
                              KYC: {user.kyc_status.toUpperCase()}
                            </span>
                          </div>
                          <div className="text-gray-400 text-sm mb-1">{user.id}</div>
                          <div className="text-gray-400 text-xs">
                            Joined: {new Date(user.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => handleToggleAdmin(user.id, user.is_admin)}
                            className={`px-3 py-1 rounded text-sm ${
                              user.is_admin
                                ? 'bg-yellow-900/30 border border-yellow-600/30 text-yellow-400 hover:bg-yellow-900/50'
                                : 'bg-teal-900/30 border border-teal-600/30 text-teal-400 hover:bg-teal-900/50'
                            }`}
                            disabled={user.id === profile?.id}
                          >
                            {user.is_admin ? 'Remove Admin' : 'Make Admin'}
                          </button>
                          <select
                            value={user.kyc_status}
                            onChange={(e) => handleUpdateKYCStatus(user.id, e.target.value as any)}
                            className="px-2 py-1 bg-[#0f0f0f] border border-teal-900/30 rounded text-white text-sm"
                          >
                            <option value="not_verified">Not Verified</option>
                            <option value="pending">Pending</option>
                            <option value="verified">Verified</option>
                          </select>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="px-3 py-1 bg-red-900/30 border border-red-600/30 text-red-400 rounded text-sm hover:bg-red-900/50"
                            disabled={user.id === profile?.id}
                          >
                            Delete User
                          </button>
                        </div>
                      </div>
                      <div className="border-t border-teal-900/30 pt-4 mt-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-white font-semibold text-sm">Asset Balances</h3>
                          <span className="text-gray-400 text-xs">Click input to edit manually or use +/- buttons</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {['BTC', 'ETH', 'USDC', 'USDT', 'XRP', 'SOL'].map((crypto) => {
                            const field = `${crypto.toLowerCase()}_balance`;
                            const currentBalance = user[field as keyof Profile] as number;
                            return (
                              <div key={crypto} className="bg-[#0f0f0f] rounded-lg p-3 border border-teal-900/30">
                                <label className="text-gray-400 block mb-2 font-medium">{crypto}</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={currentBalance}
                                  onChange={(e) => handleUpdateUserBalance(user.id, field, parseFloat(e.target.value) || 0)}
                                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-teal-900/30 rounded text-white text-sm mb-2"
                                />
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => handleAdjustBalance(user.id, field, currentBalance, -100)}
                                    className="flex-1 px-2 py-1 bg-red-900/30 border border-red-600/30 text-red-400 rounded text-xs hover:bg-red-900/50"
                                  >
                                    -100
                                  </button>
                                  <button
                                    onClick={() => handleAdjustBalance(user.id, field, currentBalance, -10)}
                                    className="flex-1 px-2 py-1 bg-red-900/30 border border-red-600/30 text-red-400 rounded text-xs hover:bg-red-900/50"
                                  >
                                    -10
                                  </button>
                                  <button
                                    onClick={() => handleAdjustBalance(user.id, field, currentBalance, 10)}
                                    className="flex-1 px-2 py-1 bg-green-900/30 border border-green-600/30 text-green-400 rounded text-xs hover:bg-green-900/50"
                                  >
                                    +10
                                  </button>
                                  <button
                                    onClick={() => handleAdjustBalance(user.id, field, currentBalance, 100)}
                                    className="flex-1 px-2 py-1 bg-green-900/30 border border-green-600/30 text-green-400 rounded text-xs hover:bg-green-900/50"
                                  >
                                    +100
                                  </button>
                                  <button
                                    onClick={() => handleUpdateUserBalance(user.id, field, 0)}
                                    className="flex-1 px-2 py-1 bg-gray-900/30 border border-gray-600/30 text-gray-400 rounded text-xs hover:bg-gray-900/50"
                                    title="Reset to 0"
                                  >
                                    Clear
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'trades' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-white">Trade Control</h2>
                    <select
                      value={tradeControl}
                      onChange={(e) => setTradeControl(e.target.value as any)}
                      className="px-4 py-2 bg-[#1a1a1a] border border-teal-900/30 rounded-md text-white"
                    >
                      <option value="normal">Normal (Random)</option>
                      <option value="win_all">Force All Wins</option>
                      <option value="lose_all">Force All Losses</option>
                    </select>
                  </div>
                  {trades.map((trade) => (
                    <div key={trade.id} className="bg-[#1a1a1a] rounded-lg p-4 border border-teal-900/30">
                      <div className="grid md:grid-cols-4 gap-4">
                        <div>
                          <div className="text-gray-400 text-sm">User</div>
                          <div className="text-white">{trade.username}</div>
                        </div>
                        <div>
                          <div className="text-gray-400 text-sm">Type</div>
                          <div className={trade.trade_type === 'BUY' ? 'text-green-500' : 'text-red-500'}>
                            {trade.trade_type}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-400 text-sm">Amount</div>
                          <div className="text-white">{trade.amount} USDT</div>
                        </div>
                        <div>
                          <div className="text-gray-400 text-sm">Outcome</div>
                          <div className={`capitalize ${
                            trade.outcome === 'win' ? 'text-green-500' :
                            trade.outcome === 'loss' ? 'text-red-500' :
                            'text-teal-400'
                          }`}>
                            {trade.outcome}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'deposits' && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-white mb-4">Deposit Requests</h2>
                  {deposits.filter((d) => d.status === 'pending').map((deposit) => (
                    <div key={deposit.id} className="bg-[#1a1a1a] rounded-lg p-4 border border-teal-900/30">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="text-white font-semibold">{deposit.amount} USDT</div>
                          <div className="text-gray-400 text-sm">{deposit.network}</div>
                          <div className="text-gray-400 text-sm">
                            {new Date(deposit.created_at).toLocaleString()}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleDepositAction(deposit.id, 'approved')}
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleDepositAction(deposit.id, 'rejected')}
                            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                      <a
                        href={deposit.proof_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-teal-400 hover:text-teal-300 text-sm"
                      >
                        View Proof
                      </a>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'withdrawals' && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-white mb-4">Withdrawal Requests</h2>
                  {withdrawals.filter((w) => w.status === 'pending').map((withdrawal) => (
                    <div key={withdrawal.id} className="bg-[#1a1a1a] rounded-lg p-4 border border-teal-900/30">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-white font-semibold">
                            {withdrawal.amount} {withdrawal.currency}
                          </div>
                          <div className="text-gray-400 text-sm break-all">{withdrawal.wallet_address}</div>
                          <div className="text-gray-400 text-sm">
                            {new Date(withdrawal.created_at).toLocaleString()}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleWithdrawalAction(withdrawal.id, 'approved')}
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleWithdrawalAction(withdrawal.id, 'rejected')}
                            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'kyc' && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-white mb-4">KYC Verification Requests</h2>
                  {kycRequests.filter((k) => k.status === 'pending').map((kyc) => (
                    <div key={kyc.id} className="bg-[#1a1a1a] rounded-lg p-4 border border-teal-900/30">
                      <div className="flex flex-col lg:flex-row justify-between gap-4 mb-4">
                        <div className="flex-1">
                          <div className="text-white font-semibold text-lg mb-3">{kyc.full_name}</div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-gray-400">Phone:</span>
                              <span className="text-white ml-2">{kyc.phone_number}</span>
                            </div>
                            <div>
                              <span className="text-gray-400">Country:</span>
                              <span className="text-white ml-2">{kyc.country}</span>
                            </div>
                            <div className="col-span-1 sm:col-span-2">
                              <span className="text-gray-400">Address:</span>
                              <span className="text-white ml-2">{kyc.full_address}</span>
                            </div>
                            <div>
                              <span className="text-gray-400">ID Number:</span>
                              <span className="text-white ml-2">{kyc.id_number}</span>
                            </div>
                            <div>
                              <span className="text-gray-400">Submitted:</span>
                              <span className="text-white ml-2">{new Date(kyc.created_at).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex lg:flex-col gap-2">
                          <button
                            onClick={() => handleKYCAction(kyc.id, 'approved')}
                            className="flex-1 lg:flex-none px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 whitespace-nowrap"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleKYCAction(kyc.id, 'rejected')}
                            className="flex-1 lg:flex-none px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 whitespace-nowrap"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        {kyc.id_front_photo_url && (
                          <a
                            href={kyc.id_front_photo_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-teal-400 hover:text-teal-300 text-sm underline"
                          >
                            View Front ID
                          </a>
                        )}
                        {kyc.id_back_photo_url && (
                          <a
                            href={kyc.id_back_photo_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-teal-400 hover:text-teal-300 text-sm underline"
                          >
                            View Back ID
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                  {kycRequests.filter((k) => k.status === 'pending').length === 0 && (
                    <div className="text-center py-8 text-gray-400">No pending KYC requests</div>
                  )}
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-white mb-4">Trade Settings</h2>
                  {tradeSettings.map((setting) => (
                    <div key={setting.duration} className="bg-[#1a1a1a] rounded-lg p-4 border border-teal-900/30">
                      <div className="grid md:grid-cols-4 gap-4">
                        <div>
                          <div className="text-gray-400 text-sm">Duration</div>
                          <div className="text-white font-semibold">{setting.duration}s</div>
                        </div>
                        <div>
                          <div className="text-gray-400 text-sm">Min Capital</div>
                          <div className="text-white">{setting.min_capital} USDT</div>
                        </div>
                        <div>
                          <label className="text-gray-400 text-sm">Win %</label>
                          <input
                            type="number"
                            value={setting.win_percentage}
                            onChange={(e) =>
                              handleUpdateTradeSetting(setting.duration, 'win_percentage', parseFloat(e.target.value))
                            }
                            className="w-full px-3 py-2 bg-[#0f0f0f] border border-teal-900/30 rounded text-white"
                          />
                        </div>
                        <div>
                          <label className="text-gray-400 text-sm">Loss %</label>
                          <input
                            type="number"
                            value={setting.loss_percentage}
                            onChange={(e) =>
                              handleUpdateTradeSetting(setting.duration, 'loss_percentage', parseFloat(e.target.value))
                            }
                            className="w-full px-3 py-2 bg-[#0f0f0f] border border-teal-900/30 rounded text-white"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
