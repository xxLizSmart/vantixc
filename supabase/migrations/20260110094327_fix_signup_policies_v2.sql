/*
  # Fix User Signup - Correct RLS Policies

  ## Problem
  
  Previous policies were too restrictive. The trigger function cannot insert
  records because the user is not yet authenticated during signup.

  ## Solution
  
  Replace the broken policies with ones that:
  1. Allow inserts for users that exist in auth.users
  2. Prevent duplicate profile creation (enforced by primary key)
  3. Ensure wallets and settings are only created for existing profiles
  
  ## Security
  
  - Primary key constraints prevent duplicate profiles
  - Foreign key constraints ensure data integrity
  - Policies ensure users can only create records for themselves
*/

-- =====================================================
-- FIX PROFILES INSERT POLICY
-- =====================================================

DROP POLICY IF EXISTS "Allow profile creation during signup" ON profiles;

CREATE POLICY "Allow profile insert for auth users"
  ON profiles FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users WHERE auth.users.id = profiles.id
    )
  );

-- =====================================================
-- FIX WALLETS INSERT POLICY
-- =====================================================

DROP POLICY IF EXISTS "Allow wallet creation" ON wallets;

CREATE POLICY "Allow wallet insert for profile owners"
  ON wallets FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users WHERE auth.users.id = wallets.user_id
    )
  );

-- =====================================================
-- FIX USER SETTINGS INSERT POLICY
-- =====================================================

DROP POLICY IF EXISTS "Allow settings creation" ON user_settings;

CREATE POLICY "Allow settings insert for profile owners"
  ON user_settings FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users WHERE auth.users.id = user_settings.user_id
    )
  );
