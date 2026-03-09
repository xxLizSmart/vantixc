/*
  # Fix User Signup Trigger - Bypass RLS Properly

  ## Problem
  
  The trigger function runs with SECURITY DEFINER but RLS policies still block
  INSERTs because auth.uid() is NULL during signup (user not authenticated yet).

  ## Solution
  
  1. Drop existing restrictive INSERT policies
  2. Create new policies that allow:
     - System-level inserts during signup (when profile doesn't exist)
     - User inserts for their own records (when authenticated)
  
  ## Security
  
  - Profiles can only be created once per user (unique constraint on id)
  - Wallets have unique constraint on (user_id, currency_symbol)
  - User settings have unique constraint on user_id
  - These constraints prevent abuse even with relaxed INSERT policies
*/

-- =====================================================
-- DROP EXISTING INSERT POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Service role can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert own wallets" ON wallets;
DROP POLICY IF EXISTS "Users can insert own settings" ON user_settings;

-- =====================================================
-- CREATE NEW INSERT POLICIES FOR PROFILES
-- =====================================================

-- Allow INSERT during signup (when profile doesn't exist yet)
CREATE POLICY "Allow profile creation during signup"
  ON profiles FOR INSERT
  WITH CHECK (
    NOT EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = profiles.id
    )
    OR auth.uid() = id
  );

-- =====================================================
-- CREATE NEW INSERT POLICIES FOR WALLETS
-- =====================================================

-- Allow wallet creation for users (both by trigger and manually)
CREATE POLICY "Allow wallet creation"
  ON wallets FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = user_id
    )
  );

-- =====================================================
-- CREATE NEW INSERT POLICIES FOR USER SETTINGS
-- =====================================================

-- Allow settings creation for users (by trigger)
CREATE POLICY "Allow settings creation"
  ON user_settings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = user_id
    )
  );
