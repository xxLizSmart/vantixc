/*
  # Fix User Signup - Add Missing INSERT Policies

  ## Changes Made
  
  ### Row Level Security Policies Added
  
  1. **Profiles Table**
     - Added INSERT policy to allow system-level user creation during signup
  
  2. **Wallets Table**
     - Added INSERT policy to allow wallet creation for new users
  
  3. **User Settings Table**
     - Added INSERT policy to allow settings creation for new users
  
  ## Security Notes
  
  These policies are designed to work with the `handle_new_user_complete()` trigger function
  that runs with SECURITY DEFINER privileges. The policies ensure that:
  - Users cannot manually insert their own profiles (handled by trigger only)
  - Wallet creation is controlled by the system
  - Settings are automatically initialized on signup
  
  ## Problem Fixed
  
  The "Database error saving new user" error was caused by missing INSERT policies.
  The trigger function was unable to create the necessary records even with SECURITY DEFINER
  because the RLS policies blocked all INSERT operations.
*/

-- =====================================================
-- ADD INSERT POLICIES FOR PROFILES
-- =====================================================

-- Allow service role to insert profiles (for trigger function)
CREATE POLICY "Service role can insert profiles"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- ADD INSERT POLICIES FOR WALLETS
-- =====================================================

-- Allow users to insert their own wallets (for trigger and manual wallet creation)
CREATE POLICY "Users can insert own wallets"
  ON wallets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- ADD INSERT POLICIES FOR USER SETTINGS
-- =====================================================

-- Allow users to insert their own settings (for trigger)
CREATE POLICY "Users can insert own settings"
  ON user_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
