/*
  # Comprehensive Crypto Trading Platform Database Schema

  ## Tables Created

  ### 1. Profiles
  User identity and verification status with trading level tracking

  ### 2. Wallets
  Multi-currency wallet system with locked balance for open orders

  ### 3. Orders
  Buy/sell order management with status tracking

  ### 4. Trade History
  Completed trade execution records

  ### 5. Transactions
  Deposit and withdrawal transaction ledger

  ### 6. User Settings
  Individual trading preferences and notification settings

  ### 7. KYC Verifications, Deposits, Withdrawals, Trades, Trade Settings
  Additional platform functionality tables

  ## Security
  - RLS enabled on all tables
  - Users can only access their own data
  - Admins have full access
  - Foreign key constraints ensure data integrity

  ## Triggers
  - Auto-create profile, USDT wallet, and settings on user signup
  - Auto-update timestamps on record changes

  ## Real-time
  - Enabled on orders, wallets, and trade_history tables
*/

-- =====================================================
-- CREATE TABLES
-- =====================================================

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  username text UNIQUE,
  full_name text,
  avatar_url text,
  is_admin boolean DEFAULT false,
  is_verified boolean DEFAULT false,
  trading_level text DEFAULT 'beginner' CHECK (trading_level IN ('beginner', 'intermediate', 'advanced', 'professional')),
  btc_balance numeric DEFAULT 0,
  eth_balance numeric DEFAULT 0,
  usdc_balance numeric DEFAULT 0,
  usdt_balance numeric DEFAULT 0,
  xrp_balance numeric DEFAULT 0,
  sol_balance numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Wallets table
CREATE TABLE IF NOT EXISTS wallets (
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
CREATE TABLE IF NOT EXISTS orders (
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
CREATE TABLE IF NOT EXISTS trade_history (
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

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
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
CREATE TABLE IF NOT EXISTS user_settings (
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

-- KYC Verifications table
CREATE TABLE IF NOT EXISTS kyc_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  first_name text NOT NULL,
  middle_name text,
  last_name text NOT NULL,
  phone_number text NOT NULL,
  continent text NOT NULL,
  full_address text NOT NULL,
  id_type text NOT NULL CHECK (id_type IN ('id_card', 'drivers_license', 'passport')),
  id_number text NOT NULL,
  id_photo_url text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now(),
  reviewed_at timestamptz
);

-- Deposits table
CREATE TABLE IF NOT EXISTS deposits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount numeric NOT NULL CHECK (amount >= 100),
  network text NOT NULL CHECK (network IN ('TRC20', 'ERC20', 'ETH', 'BTC')),
  proof_url text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now(),
  reviewed_at timestamptz
);

-- Withdrawals table
CREATE TABLE IF NOT EXISTS withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount numeric NOT NULL CHECK (amount >= 100),
  currency text NOT NULL CHECK (currency IN ('USDT', 'ETH', 'USDC', 'BTC', 'XRP', 'SOL')),
  wallet_address text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now(),
  reviewed_at timestamptz
);

-- Trades table (binary options style)
CREATE TABLE IF NOT EXISTS trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  trade_type text NOT NULL CHECK (trade_type IN ('BUY', 'SELL')),
  amount numeric NOT NULL,
  duration integer NOT NULL CHECK (duration IN (30, 60, 90, 120, 150, 180, 210)),
  outcome text DEFAULT 'pending' CHECK (outcome IN ('pending', 'win', 'loss')),
  profit_loss numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Trade Settings table
CREATE TABLE IF NOT EXISTS trade_settings (
  duration integer PRIMARY KEY CHECK (duration IN (30, 60, 90, 120, 150, 180, 210)),
  min_capital numeric NOT NULL,
  win_percentage numeric NOT NULL,
  loss_percentage numeric NOT NULL
);

-- =====================================================
-- INSERT DEFAULT DATA
-- =====================================================

INSERT INTO trade_settings (duration, min_capital, win_percentage, loss_percentage) VALUES
  (30, 100, 20.00, 70.00),
  (60, 1000, 25.00, 70.00),
  (90, 5000, 30.00, 70.00),
  (120, 7000, 35.00, 70.00),
  (150, 10000, 40.00, 70.00),
  (180, 20000, 45.00, 70.00),
  (210, 50000, 50.00, 70.00)
ON CONFLICT (duration) DO NOTHING;

-- =====================================================
-- CREATE INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_wallets_user_currency ON wallets(user_id, currency_symbol);
CREATE INDEX IF NOT EXISTS idx_orders_user_status ON orders(user_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_trading_pair ON orders(trading_pair, status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trade_history_user ON trade_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trade_history_pair ON trade_history(trading_pair, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_hash ON transactions(transaction_hash);

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

-- =====================================================
-- RLS POLICIES - PROFILES
-- =====================================================

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );

CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );

-- =====================================================
-- RLS POLICIES - WALLETS
-- =====================================================

CREATE POLICY "Users can view own wallets"
  ON wallets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own wallets"
  ON wallets FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all wallets"
  ON wallets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );

CREATE POLICY "Admins can update all wallets"
  ON wallets FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );

-- =====================================================
-- RLS POLICIES - ORDERS
-- =====================================================

CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all orders"
  ON orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );

CREATE POLICY "Admins can update all orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );

-- =====================================================
-- RLS POLICIES - TRADE HISTORY
-- =====================================================

CREATE POLICY "Users can view own trade history"
  ON trade_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trade history"
  ON trade_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all trade history"
  ON trade_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );

-- =====================================================
-- RLS POLICIES - TRANSACTIONS
-- =====================================================

CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );

CREATE POLICY "Admins can insert transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );

-- =====================================================
-- RLS POLICIES - USER SETTINGS
-- =====================================================

CREATE POLICY "Users can view own settings"
  ON user_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON user_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all settings"
  ON user_settings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );

-- =====================================================
-- RLS POLICIES - KYC
-- =====================================================

CREATE POLICY "Users can view own KYC"
  ON kyc_verifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own KYC"
  ON kyc_verifications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all KYC"
  ON kyc_verifications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );

CREATE POLICY "Admins can update all KYC"
  ON kyc_verifications FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );

-- =====================================================
-- RLS POLICIES - DEPOSITS
-- =====================================================

CREATE POLICY "Users can view own deposits"
  ON deposits FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own deposits"
  ON deposits FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all deposits"
  ON deposits FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );

CREATE POLICY "Admins can update all deposits"
  ON deposits FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );

-- =====================================================
-- RLS POLICIES - WITHDRAWALS
-- =====================================================

CREATE POLICY "Users can view own withdrawals"
  ON withdrawals FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own withdrawals"
  ON withdrawals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all withdrawals"
  ON withdrawals FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );

CREATE POLICY "Admins can update all withdrawals"
  ON withdrawals FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );

-- =====================================================
-- RLS POLICIES - TRADES (Binary Options)
-- =====================================================

CREATE POLICY "Users can view own trades"
  ON trades FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trades"
  ON trades FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trades"
  ON trades FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all trades"
  ON trades FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );

CREATE POLICY "Admins can update all trades"
  ON trades FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );

-- =====================================================
-- RLS POLICIES - TRADE SETTINGS
-- =====================================================

CREATE POLICY "Everyone can view trade settings"
  ON trade_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can update trade settings"
  ON trade_settings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );

-- =====================================================
-- TRIGGER FUNCTIONS
-- =====================================================

-- Function to create profile, USDT wallet, and settings on user signup
CREATE OR REPLACE FUNCTION handle_new_user_complete()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile
  INSERT INTO profiles (id, username, created_at, updated_at)
  VALUES (NEW.id, NEW.email, now(), now())
  ON CONFLICT (id) DO NOTHING;

  -- Create USDT wallet (main trading wallet)
  INSERT INTO wallets (user_id, currency_symbol, balance, locked_balance)
  VALUES (NEW.id, 'USDT', 0, 0)
  ON CONFLICT (user_id, currency_symbol) DO NOTHING;

  -- Create default user settings
  INSERT INTO user_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update wallet timestamps
CREATE OR REPLACE FUNCTION update_wallet_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update user settings timestamp
CREATE OR REPLACE FUNCTION update_user_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update transaction timestamp
CREATE OR REPLACE FUNCTION update_transaction_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update profile timestamp
CREATE OR REPLACE FUNCTION update_profile_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- CREATE TRIGGERS
-- =====================================================

-- Trigger for new user setup (profile + wallet + settings)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_complete();

-- Trigger for wallet timestamp updates
DROP TRIGGER IF EXISTS update_wallet_timestamp_trigger ON wallets;
CREATE TRIGGER update_wallet_timestamp_trigger
  BEFORE UPDATE ON wallets
  FOR EACH ROW EXECUTE FUNCTION update_wallet_timestamp();

-- Trigger for user settings timestamp updates
DROP TRIGGER IF EXISTS update_user_settings_timestamp_trigger ON user_settings;
CREATE TRIGGER update_user_settings_timestamp_trigger
  BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_user_settings_timestamp();

-- Trigger for transaction timestamp updates
DROP TRIGGER IF EXISTS update_transaction_timestamp_trigger ON transactions;
CREATE TRIGGER update_transaction_timestamp_trigger
  BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_transaction_timestamp();

-- Trigger for profile timestamp updates
DROP TRIGGER IF EXISTS update_profile_timestamp_trigger ON profiles;
CREATE TRIGGER update_profile_timestamp_trigger
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_profile_timestamp();

-- =====================================================
-- ENABLE REAL-TIME SUBSCRIPTIONS
-- =====================================================

-- Note: Real-time subscriptions are configured in the Supabase Dashboard
-- or via Supabase CLI. The following are the recommended tables:
-- - orders (for live order updates)
-- - wallets (for live balance updates)
-- - trade_history (for instant trade notifications)

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
