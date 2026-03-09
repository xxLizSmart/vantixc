import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function toNumber(value: number | string | undefined | null): number {
  if (value === undefined || value === null) return 0;
  return typeof value === 'string' ? parseFloat(value) || 0 : value;
}

export type Profile = {
  id: string;
  username: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  btc_balance: number | string;
  eth_balance: number | string;
  usdc_balance: number | string;
  usdt_balance: number | string;
  xrp_balance: number | string;
  sol_balance: number | string;
  kyc_status: 'not_verified' | 'pending' | 'verified';
  created_at: string;
  updated_at: string;
};

export type KYCVerification = {
  id: string;
  user_id: string;
  full_name: string;
  phone_number: string;
  full_address: string;
  country: string;
  id_number: string;
  id_front_photo_url: string;
  id_back_photo_url: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  reviewed_at: string | null;
};

export type Deposit = {
  id: string;
  user_id: string;
  amount: number;
  network: 'TRC20' | 'ERC20' | 'ETH';
  proof_url: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  reviewed_at: string | null;
};

export type Withdrawal = {
  id: string;
  user_id: string;
  amount: number;
  currency: 'USDT' | 'ETH' | 'USDC' | 'BTC';
  wallet_address: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  reviewed_at: string | null;
};

export type Trade = {
  id: string;
  user_id: string;
  trade_type: 'BUY' | 'SELL';
  amount: number;
  duration: 30 | 60 | 90 | 120 | 150 | 180 | 210;
  outcome: 'pending' | 'win' | 'loss';
  profit_loss: number;
  created_at: string;
  completed_at: string | null;
};

export type TradeSetting = {
  duration: number;
  min_capital: number;
  win_percentage: number;
  loss_percentage: number;
};

export type Transaction = {
  id: string;
  user_id: string;
  type: 'deposit' | 'withdrawal' | 'trade' | 'swap';
  amount: number;
  currency: string;
  status: string;
  details: any;
  created_at: string;
};
