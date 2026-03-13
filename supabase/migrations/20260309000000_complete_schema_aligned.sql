/*
  # Complete Aligned Database Schema for Vantixc Trading Platform

  This migration creates the full schema aligned with the frontend code.
  It can be run on a fresh Supabase project.

  Key alignments from the codebase:
  - profiles.kyc_status field ('not_verified' | 'pending' | 'verified')
  - kyc_verifications uses: full_name, country, id_front_photo_url, id_back_photo_url
  - deposits.network includes 'BTC' in addition to TRC20/ERC20/ETH
  - withdrawals.currency includes 'XRP' and 'SOL'
  - crypto_prices table for live price ticker
  - trade_settings with 7 duration options (30-210 min)
*/

-- =====================================================
-- DROP EXISTING (for clean setup on fresh DB)
-- =====================================================

DROP TABLE IF EXISTS trade_settings CASCADE;
DROP TABLE IF EXISTS trades CASCADE;
DROP TABLE IF EXISTS withdrawals CASCADE;
DROP TABLE IF EXISTS deposits CASCADE;
DROP TABLE IF EXISTS kyc_verifications CASCADE;
DROP TABLE IF EXISTS user_settings CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS trade_history CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS wallets CASCADE;
DROP TABLE IF EXISTS crypto_prices CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- =====================================================
-- CREATE TABLES
-- =====================================================

-- Profiles table (central user record)
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  username text UNIQUE,
  avatar_url text,
  is_admin boolean DEFAULT false,
  kyc_status text DEFAULT 'not_verified' CHECK (kyc_status IN ('not_verified', 'pending', 'verified')),
  trading_level text DEFAULT 'beginner' CHECK (trading_level IN ('beginner', 'intermediate', 'advanced', 'professional')),
  btc_balance numeric(20, 8) DEFAULT 0 CHECK (btc_balance >= 0),
  eth_balance numeric(20, 8) DEFAULT 0 CHECK (eth_balance >= 0),
  usdc_balance numeric(20, 8) DEFAULT 0 CHECK (usdc_balance >= 0),
  usdt_balance numeric(20, 8) DEFAULT 0 CHECK (usdt_balance >= 0),
  xrp_balance numeric(20, 8) DEFAULT 0 CHECK (xrp_balance >= 0),
  sol_balance numeric(20, 8) DEFAULT 0 CHECK (sol_balance >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Wallets table (multi-currency wallet)
CREATE TABLE wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  currency_symbol text NOT NULL CHECK (currency_symbol IN ('BTC', 'ETH', 'USDT', 'USDC', 'XRP', 'SOL')),
  balance numeric(20, 8) DEFAULT 0 NOT NULL CHECK (balance >= 0),
  locked_balance numeric(20, 8) DEFAULT 0 NOT NULL CHECK (locked_balance >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, currency_symbol)
);

-- Orders table
CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  order_type text NOT NULL CHECK (order_type IN ('buy', 'sell')),
  trading_pair text NOT NULL,
  base_currency text NOT NULL,
  quote_currency text NOT NULL,
  amount numeric(20, 8) NOT NULL CHECK (amount > 0),
  price numeric(20, 8) NOT NULL CHECK (price > 0),
  total_value numeric(20, 8) NOT NULL CHECK (total_value > 0),
  filled_amount numeric(20, 8) DEFAULT 0 NOT NULL CHECK (filled_amount >= 0),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'partially_filled', 'filled', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  filled_at timestamptz,
  cancelled_at timestamptz
);

-- Trade History table
CREATE TABLE trade_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  trade_type text NOT NULL CHECK (trade_type IN ('buy', 'sell')),
  trading_pair text NOT NULL,
  base_currency text NOT NULL,
  quote_currency text NOT NULL,
  amount numeric(20, 8) NOT NULL CHECK (amount > 0),
  execution_price numeric(20, 8) NOT NULL CHECK (execution_price > 0),
  total_value numeric(20, 8) NOT NULL CHECK (total_value > 0),
  fee_amount numeric(20, 8) DEFAULT 0 NOT NULL,
  fee_currency text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Transactions table (full ledger)
CREATE TABLE transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'trade', 'swap')),
  amount numeric NOT NULL,
  currency text NOT NULL,
  status text NOT NULL,
  transaction_hash text,
  network text,
  from_address text,
  to_address text,
  confirmations integer DEFAULT 0,
  details jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User Settings table
CREATE TABLE user_settings (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  default_leverage numeric DEFAULT 1 CHECK (default_leverage >= 1 AND default_leverage <= 100),
  notifications_enabled boolean DEFAULT true,
  trade_notifications boolean DEFAULT true,
  deposit_notifications boolean DEFAULT true,
  withdrawal_notifications boolean DEFAULT true,
  theme text DEFAULT 'dark' CHECK (theme IN ('light', 'dark', 'auto')),
  language text DEFAULT 'en',
  currency_display text DEFAULT 'USD',
  two_factor_enabled boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- KYC Verifications table (aligned with frontend code)
-- Frontend uses: full_name, country, id_front_photo_url, id_back_photo_url
CREATE TABLE kyc_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  full_name text NOT NULL,
  phone_number text NOT NULL,
  full_address text NOT NULL,
  country text NOT NULL,
  id_number text NOT NULL,
  id_front_photo_url text NOT NULL,
  id_back_photo_url text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now(),
  reviewed_at timestamptz
);

-- Deposits table
CREATE TABLE deposits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount numeric NOT NULL CHECK (amount >= 100),
  network text NOT NULL CHECK (network IN ('TRC20', 'ERC20', 'ETH', 'BTC')),
  proof_url text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now(),
  reviewed_at timestamptz
);

-- Withdrawals table (includes XRP and SOL currencies)
CREATE TABLE withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount numeric NOT NULL CHECK (amount >= 100),
  currency text NOT NULL CHECK (currency IN ('USDT', 'ETH', 'USDC', 'BTC', 'XRP', 'SOL')),
  wallet_address text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now(),
  reviewed_at timestamptz
);

-- Trades table (binary options style trading)
CREATE TABLE trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  trade_type text NOT NULL CHECK (trade_type IN ('BUY', 'SELL')),
  amount numeric NOT NULL CHECK (amount > 0),
  duration integer NOT NULL CHECK (duration IN (30, 60, 90, 120, 150, 180, 210)),
  outcome text DEFAULT 'pending' CHECK (outcome IN ('pending', 'win', 'loss')),
  profit_loss numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Trade Settings table (configurable per duration by admin)
CREATE TABLE trade_settings (
  duration integer PRIMARY KEY CHECK (duration IN (30, 60, 90, 120, 150, 180, 210)),
  min_capital numeric NOT NULL DEFAULT 100,
  win_percentage numeric NOT NULL DEFAULT 20,
  loss_percentage numeric NOT NULL DEFAULT 70
);

-- Crypto Prices table (for the live price ticker)
CREATE TABLE crypto_prices (
  symbol text PRIMARY KEY,
  price_usd numeric NOT NULL DEFAULT 0,
  price_change_24h numeric DEFAULT 0,
  market_cap numeric DEFAULT 0,
  volume_24h numeric DEFAULT 0,
  circulating_supply numeric DEFAULT 0,
  last_updated timestamptz DEFAULT now()
);

-- =====================================================
-- INSERT DEFAULT DATA
-- =====================================================

-- Trade settings defaults
INSERT INTO trade_settings (duration, min_capital, win_percentage, loss_percentage) VALUES
  (30,  100,   20.00, 70.00),
  (60,  1000,  25.00, 70.00),
  (90,  5000,  30.00, 70.00),
  (120, 7000,  35.00, 70.00),
  (150, 10000, 40.00, 70.00),
  (180, 20000, 45.00, 70.00),
  (210, 50000, 50.00, 70.00);

-- Initial crypto price data
INSERT INTO crypto_prices (symbol, price_usd, price_change_24h, market_cap, volume_24h, circulating_supply) VALUES
  ('BTC',  43000.00, 2.5,  850000000000, 25000000000, 19500000),
  ('ETH',  2300.00,  1.8,  276000000000, 12000000000, 120000000),
  ('USDT', 1.00,     0.01, 95000000000,  50000000000, 95000000000),
  ('USDC', 1.00,     0.00, 43000000000,  6000000000,  43000000000),
  ('XRP',  0.60,     3.2,  32000000000,  1500000000,  53000000000),
  ('SOL',  100.00,   4.1,  43000000000,  2000000000,  430000000),
  ('BNB',  350.00,   1.2,  53000000000,  800000000,   150000000),
  ('ADA',  0.45,     -1.5, 15000000000,  300000000,   35000000000)
ON CONFLICT (symbol) DO UPDATE SET
  price_usd = EXCLUDED.price_usd,
  price_change_24h = EXCLUDED.price_change_24h,
  last_updated = now();

-- =====================================================
-- CREATE INDEXES
-- =====================================================

CREATE INDEX idx_wallets_user_currency ON wallets(user_id, currency_symbol);
CREATE INDEX idx_orders_user_status ON orders(user_id, status);
CREATE INDEX idx_trade_history_user ON trade_history(user_id, created_at DESC);
CREATE INDEX idx_transactions_user ON transactions(user_id, created_at DESC);
CREATE INDEX idx_trades_user ON trades(user_id, created_at DESC);
CREATE INDEX idx_trades_outcome ON trades(outcome, created_at DESC);
CREATE INDEX idx_deposits_user ON deposits(user_id, created_at DESC);
CREATE INDEX idx_withdrawals_user ON withdrawals(user_id, created_at DESC);
CREATE INDEX idx_kyc_user ON kyc_verifications(user_id);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyc_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE crypto_prices ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- ADMIN HELPER FUNCTION (avoids RLS recursion)
-- =====================================================

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_admin = true
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- =====================================================
-- RLS POLICIES - PROFILES
-- =====================================================

CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_admin_select" ON profiles
  FOR SELECT TO authenticated USING (is_admin());

CREATE POLICY "profiles_admin_update" ON profiles
  FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "profiles_admin_delete" ON profiles
  FOR DELETE TO authenticated USING (is_admin());

-- =====================================================
-- RLS POLICIES - WALLETS
-- =====================================================

CREATE POLICY "wallets_select_own" ON wallets
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "wallets_insert_own" ON wallets
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "wallets_update_own" ON wallets
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "wallets_admin_all" ON wallets
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- =====================================================
-- RLS POLICIES - ORDERS
-- =====================================================

CREATE POLICY "orders_select_own" ON orders
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "orders_insert_own" ON orders
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "orders_update_own" ON orders
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "orders_admin_all" ON orders
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- =====================================================
-- RLS POLICIES - TRADE HISTORY
-- =====================================================

CREATE POLICY "trade_history_select_own" ON trade_history
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "trade_history_insert_own" ON trade_history
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "trade_history_admin_all" ON trade_history
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- =====================================================
-- RLS POLICIES - TRANSACTIONS
-- =====================================================

CREATE POLICY "transactions_select_own" ON transactions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "transactions_insert_own" ON transactions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "transactions_admin_all" ON transactions
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- =====================================================
-- RLS POLICIES - USER SETTINGS
-- =====================================================

CREATE POLICY "user_settings_select_own" ON user_settings
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "user_settings_insert_own" ON user_settings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_settings_update_own" ON user_settings
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_settings_admin_all" ON user_settings
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- =====================================================
-- RLS POLICIES - KYC VERIFICATIONS
-- =====================================================

CREATE POLICY "kyc_select_own" ON kyc_verifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "kyc_insert_own" ON kyc_verifications
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "kyc_admin_all" ON kyc_verifications
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- =====================================================
-- RLS POLICIES - DEPOSITS
-- =====================================================

CREATE POLICY "deposits_select_own" ON deposits
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "deposits_insert_own" ON deposits
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "deposits_admin_all" ON deposits
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- =====================================================
-- RLS POLICIES - WITHDRAWALS
-- =====================================================

CREATE POLICY "withdrawals_select_own" ON withdrawals
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "withdrawals_insert_own" ON withdrawals
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "withdrawals_admin_all" ON withdrawals
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- =====================================================
-- RLS POLICIES - TRADES
-- =====================================================

CREATE POLICY "trades_select_own" ON trades
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "trades_insert_own" ON trades
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "trades_update_own" ON trades
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "trades_admin_all" ON trades
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- =====================================================
-- RLS POLICIES - TRADE SETTINGS (public read)
-- =====================================================

CREATE POLICY "trade_settings_select_all" ON trade_settings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "trade_settings_admin_update" ON trade_settings
  FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- =====================================================
-- RLS POLICIES - CRYPTO PRICES (public read)
-- =====================================================

CREATE POLICY "crypto_prices_select_all" ON crypto_prices
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "crypto_prices_select_anon" ON crypto_prices
  FOR SELECT TO anon USING (true);

CREATE POLICY "crypto_prices_admin_all" ON crypto_prices
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- =====================================================
-- TRIGGER FUNCTIONS
-- =====================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, username, created_at, updated_at)
  VALUES (NEW.id, NEW.email, now(), now())
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO user_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- CREATE TRIGGERS
-- =====================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS wallets_updated_at ON wallets;
CREATE TRIGGER wallets_updated_at
  BEFORE UPDATE ON wallets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS transactions_updated_at ON transactions;
CREATE TRIGGER transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS user_settings_updated_at ON user_settings;
CREATE TRIGGER user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- SEED DATA — Default Admin Account
-- =====================================================
-- Creates the default admin user in Supabase Auth then marks them as admin.
-- Password: admin123  (change after first login!)
--
-- Run this AFTER the schema migration in the Supabase SQL Editor:
--
--   SELECT create_default_admin();
--
CREATE OR REPLACE FUNCTION create_default_admin()
RETURNS text AS $$
DECLARE
  _uid uuid;
BEGIN
  -- Create the auth user (Supabase helper)
  _uid := (
    SELECT id FROM auth.users WHERE email = 'admin@vantix.com' LIMIT 1
  );

  IF _uid IS NULL THEN
    -- Insert directly into auth.users (works in SQL Editor with service role)
    INSERT INTO auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      confirmation_token
    ) VALUES (
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'admin@vantix.com',
      crypt('admin123', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      false,
      ''
    )
    RETURNING id INTO _uid;
  END IF;

  -- Ensure profile row exists and is flagged as admin
  INSERT INTO profiles (id, username, is_admin, kyc_status, created_at, updated_at)
  VALUES (_uid, 'Admin', true, 'verified', now(), now())
  ON CONFLICT (id) DO UPDATE SET is_admin = true, username = 'Admin', kyc_status = 'verified';

  -- Seed balances for demo
  UPDATE profiles SET
    btc_balance  = 1.5,
    eth_balance  = 10.0,
    usdc_balance = 5000.0,
    usdt_balance = 5000.0,
    xrp_balance  = 2000.0,
    sol_balance  = 50.0
  WHERE id = _uid;

  RETURN 'Admin created: admin@vantix.com / admin123 — change password after first login!';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
