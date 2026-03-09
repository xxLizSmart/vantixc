/*
  # Add Admin Policies for All Tables

  1. Problem
    - Admin panel needs to access all tables but may be blocked by RLS
    - Admins need to view and update deposits, withdrawals, KYC, transactions, trades

  2. Solution
    - Add admin policies to all relevant tables
    - Use the is_admin_user() function to avoid recursion
    - Ensure admins can perform all necessary operations

  3. Security
    - Regular users can only access their own data
    - Admins can access all data through separate policies
*/

-- Deposits: Admin policies
DROP POLICY IF EXISTS "Admins can view all deposits" ON deposits;
DROP POLICY IF EXISTS "Admins can update all deposits" ON deposits;

CREATE POLICY "Admins can view all deposits"
  ON deposits
  FOR SELECT
  TO authenticated
  USING (is_admin_user());

CREATE POLICY "Admins can update all deposits"
  ON deposits
  FOR UPDATE
  TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

-- Withdrawals: Admin policies
DROP POLICY IF EXISTS "Admins can view all withdrawals" ON withdrawals;
DROP POLICY IF EXISTS "Admins can update all withdrawals" ON withdrawals;

CREATE POLICY "Admins can view all withdrawals"
  ON withdrawals
  FOR SELECT
  TO authenticated
  USING (is_admin_user());

CREATE POLICY "Admins can update all withdrawals"
  ON withdrawals
  FOR UPDATE
  TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

-- KYC Verifications: Admin policies
DROP POLICY IF EXISTS "Admins can view all kyc" ON kyc_verifications;
DROP POLICY IF EXISTS "Admins can update all kyc" ON kyc_verifications;

CREATE POLICY "Admins can view all kyc"
  ON kyc_verifications
  FOR SELECT
  TO authenticated
  USING (is_admin_user());

CREATE POLICY "Admins can update all kyc"
  ON kyc_verifications
  FOR UPDATE
  TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

-- Transactions: Admin policies
DROP POLICY IF EXISTS "Admins can view all transactions" ON transactions;
DROP POLICY IF EXISTS "Admins can insert transactions" ON transactions;
DROP POLICY IF EXISTS "Admins can update all transactions" ON transactions;

CREATE POLICY "Admins can view all transactions"
  ON transactions
  FOR SELECT
  TO authenticated
  USING (is_admin_user());

CREATE POLICY "Admins can insert transactions"
  ON transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin_user());

CREATE POLICY "Admins can update all transactions"
  ON transactions
  FOR UPDATE
  TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

-- Trades: Admin policies
DROP POLICY IF EXISTS "Admins can view all trades" ON trades;
DROP POLICY IF EXISTS "Admins can update all trades" ON trades;

CREATE POLICY "Admins can view all trades"
  ON trades
  FOR SELECT
  TO authenticated
  USING (is_admin_user());

CREATE POLICY "Admins can update all trades"
  ON trades
  FOR UPDATE
  TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

-- Trade Settings: Admin policies
DROP POLICY IF EXISTS "Admins can view trade settings" ON trade_settings;
DROP POLICY IF EXISTS "Admins can update trade settings" ON trade_settings;

CREATE POLICY "Admins can view trade settings"
  ON trade_settings
  FOR SELECT
  TO authenticated
  USING (is_admin_user());

CREATE POLICY "Admins can update trade settings"
  ON trade_settings
  FOR UPDATE
  TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());