/*
  # Ensure User Access Policies

  1. Purpose
    - Ensure regular users can access their own data
    - Users need to view/insert their own deposits, withdrawals, KYC, transactions, trades

  2. Policies Added
    - Users can view/insert their own deposits
    - Users can view/insert their own withdrawals
    - Users can view/insert their own KYC
    - Users can view their own transactions
    - Users can view/insert/update their own trades

  3. Security
    - Users can only access their own records
    - No cross-user data access
*/

-- Deposits: User policies
DROP POLICY IF EXISTS "Users can view own deposits" ON deposits;
DROP POLICY IF EXISTS "Users can insert own deposits" ON deposits;

CREATE POLICY "Users can view own deposits"
  ON deposits
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own deposits"
  ON deposits
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Withdrawals: User policies
DROP POLICY IF EXISTS "Users can view own withdrawals" ON withdrawals;
DROP POLICY IF EXISTS "Users can insert own withdrawals" ON withdrawals;

CREATE POLICY "Users can view own withdrawals"
  ON withdrawals
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own withdrawals"
  ON withdrawals
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- KYC Verifications: User policies
DROP POLICY IF EXISTS "Users can view own kyc" ON kyc_verifications;
DROP POLICY IF EXISTS "Users can insert own kyc" ON kyc_verifications;

CREATE POLICY "Users can view own kyc"
  ON kyc_verifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own kyc"
  ON kyc_verifications
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Transactions: User policies
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;

CREATE POLICY "Users can view own transactions"
  ON transactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Trades: User policies
DROP POLICY IF EXISTS "Users can view own trades" ON trades;
DROP POLICY IF EXISTS "Users can insert own trades" ON trades;
DROP POLICY IF EXISTS "Users can update own trades" ON trades;

CREATE POLICY "Users can view own trades"
  ON trades
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trades"
  ON trades
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trades"
  ON trades
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trade Settings: Public read access (all users need to see settings)
DROP POLICY IF EXISTS "Anyone can view trade settings" ON trade_settings;

CREATE POLICY "Anyone can view trade settings"
  ON trade_settings
  FOR SELECT
  TO authenticated
  USING (true);