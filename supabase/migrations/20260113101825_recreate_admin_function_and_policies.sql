/*
  # Recreate Admin Function and Policies

  1. Problem
    - Need to update is_admin_user() function to prevent recursion
    - Cannot drop function without cascading to dependent policies

  2. Solution
    - Drop function with CASCADE
    - Recreate function with proper RLS bypass
    - Recreate all admin policies

  3. Security
    - Function explicitly bypasses RLS using SECURITY DEFINER
    - All admin policies properly recreated
*/

-- Drop function and all dependent policies
DROP FUNCTION IF EXISTS public.is_admin_user() CASCADE;

-- Recreate the admin check function with proper RLS bypass
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  is_admin BOOLEAN;
BEGIN
  -- Query profiles directly, bypassing RLS due to SECURITY DEFINER
  SELECT profiles.is_admin INTO is_admin
  FROM public.profiles
  WHERE profiles.id = auth.uid()
  LIMIT 1;
  
  RETURN COALESCE(is_admin, false);
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.is_admin_user() TO authenticated, anon;

-- Recreate all admin policies for profiles
CREATE POLICY "Admins can view all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (is_admin_user());

CREATE POLICY "Admins can update all profiles"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

-- Recreate admin policies for deposits
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

-- Recreate admin policies for withdrawals
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

-- Recreate admin policies for kyc_verifications
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

-- Recreate admin policies for transactions
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

-- Recreate admin policies for trades
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

-- Recreate admin policies for trade_settings
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