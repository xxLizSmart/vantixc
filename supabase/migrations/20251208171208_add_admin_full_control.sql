/*
  # Add Full Admin Control Over All Users

  1. Changes
    - Create secure function to check if user is admin (prevents recursion)
    - Update profiles table policies for admin CRUD operations
    - Update all related tables (transactions, deposits, withdrawals, kyc_verifications, trades)
    - Allow admins to view, edit, add, and delete all user data

  2. Security
    - Function uses SECURITY DEFINER to safely check admin status
    - Admins have full control over all user data
    - Regular users still have restricted access to their own data only
*/

-- Create a secure function to check if current user is admin
-- This prevents infinite recursion in RLS policies
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN COALESCE(
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()),
    false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- ============================================
-- PROFILES TABLE - Admin Full Control
-- ============================================

-- Admins can view all profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (public.is_admin() = true);

-- Admins can update any profile
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (public.is_admin() = true)
  WITH CHECK (public.is_admin() = true);

-- Admins can delete any profile
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;
CREATE POLICY "Admins can delete profiles"
  ON profiles FOR DELETE
  TO authenticated
  USING (public.is_admin() = true);

-- Admins can insert profiles
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
CREATE POLICY "Admins can insert profiles"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin() = true);

-- ============================================
-- TRANSACTIONS TABLE - Admin Full Control
-- ============================================

-- Admins can view all transactions
DROP POLICY IF EXISTS "Admins can view all transactions" ON transactions;
CREATE POLICY "Admins can view all transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (public.is_admin() = true);

-- Admins can update any transaction
DROP POLICY IF EXISTS "Admins can update any transaction" ON transactions;
CREATE POLICY "Admins can update any transaction"
  ON transactions FOR UPDATE
  TO authenticated
  USING (public.is_admin() = true)
  WITH CHECK (public.is_admin() = true);

-- Admins can delete any transaction
DROP POLICY IF EXISTS "Admins can delete transactions" ON transactions;
CREATE POLICY "Admins can delete transactions"
  ON transactions FOR DELETE
  TO authenticated
  USING (public.is_admin() = true);

-- ============================================
-- DEPOSITS TABLE - Admin Full Control
-- ============================================

-- Admins can view all deposits
DROP POLICY IF EXISTS "Admins can view all deposits" ON deposits;
CREATE POLICY "Admins can view all deposits"
  ON deposits FOR SELECT
  TO authenticated
  USING (public.is_admin() = true);

-- Admins can update any deposit
DROP POLICY IF EXISTS "Admins can update deposits" ON deposits;
CREATE POLICY "Admins can update deposits"
  ON deposits FOR UPDATE
  TO authenticated
  USING (public.is_admin() = true)
  WITH CHECK (public.is_admin() = true);

-- Admins can delete deposits
DROP POLICY IF EXISTS "Admins can delete deposits" ON deposits;
CREATE POLICY "Admins can delete deposits"
  ON deposits FOR DELETE
  TO authenticated
  USING (public.is_admin() = true);

-- ============================================
-- WITHDRAWALS TABLE - Admin Full Control
-- ============================================

-- Admins can view all withdrawals
DROP POLICY IF EXISTS "Admins can view all withdrawals" ON withdrawals;
CREATE POLICY "Admins can view all withdrawals"
  ON withdrawals FOR SELECT
  TO authenticated
  USING (public.is_admin() = true);

-- Admins can update any withdrawal
DROP POLICY IF EXISTS "Admins can update withdrawals" ON withdrawals;
CREATE POLICY "Admins can update withdrawals"
  ON withdrawals FOR UPDATE
  TO authenticated
  USING (public.is_admin() = true)
  WITH CHECK (public.is_admin() = true);

-- Admins can delete withdrawals
DROP POLICY IF EXISTS "Admins can delete withdrawals" ON withdrawals;
CREATE POLICY "Admins can delete withdrawals"
  ON withdrawals FOR DELETE
  TO authenticated
  USING (public.is_admin() = true);

-- ============================================
-- KYC_VERIFICATIONS TABLE - Admin Full Control
-- ============================================

-- Admins can view all KYC verifications
DROP POLICY IF EXISTS "Admins can view all KYC" ON kyc_verifications;
CREATE POLICY "Admins can view all KYC"
  ON kyc_verifications FOR SELECT
  TO authenticated
  USING (public.is_admin() = true);

-- Admins can update any KYC
DROP POLICY IF EXISTS "Admins can update KYC" ON kyc_verifications;
CREATE POLICY "Admins can update KYC"
  ON kyc_verifications FOR UPDATE
  TO authenticated
  USING (public.is_admin() = true)
  WITH CHECK (public.is_admin() = true);

-- Admins can delete KYC
DROP POLICY IF EXISTS "Admins can delete KYC" ON kyc_verifications;
CREATE POLICY "Admins can delete KYC"
  ON kyc_verifications FOR DELETE
  TO authenticated
  USING (public.is_admin() = true);

-- ============================================
-- TRADES TABLE - Admin Full Control
-- ============================================

-- Admins can view all trades
DROP POLICY IF EXISTS "Admins can view all trades" ON trades;
CREATE POLICY "Admins can view all trades"
  ON trades FOR SELECT
  TO authenticated
  USING (public.is_admin() = true);

-- Admins can update any trade
DROP POLICY IF EXISTS "Admins can update trades" ON trades;
CREATE POLICY "Admins can update trades"
  ON trades FOR UPDATE
  TO authenticated
  USING (public.is_admin() = true)
  WITH CHECK (public.is_admin() = true);

-- Admins can delete trades
DROP POLICY IF EXISTS "Admins can delete trades" ON trades;
CREATE POLICY "Admins can delete trades"
  ON trades FOR DELETE
  TO authenticated
  USING (public.is_admin() = true);

-- Admins can insert trades
DROP POLICY IF EXISTS "Admins can insert trades" ON trades;
CREATE POLICY "Admins can insert trades"
  ON trades FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin() = true);