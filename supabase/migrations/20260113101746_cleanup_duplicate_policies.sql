/*
  # Cleanup Duplicate Policies

  1. Problem
    - Multiple duplicate policies exist from previous migrations
    - Old public insert policy on profiles table is a security risk

  2. Solution
    - Remove duplicate policies
    - Remove the insecure public insert policy
    - Keep only the clean, necessary policies

  3. Security
    - Ensure only authenticated users can insert profiles
    - No public access to profiles table
*/

-- Clean up duplicate KYC policies (keep the lowercase versions)
DROP POLICY IF EXISTS "Admins can update all KYC" ON kyc_verifications;
DROP POLICY IF EXISTS "Admins can view all KYC" ON kyc_verifications;
DROP POLICY IF EXISTS "Users can insert own KYC" ON kyc_verifications;
DROP POLICY IF EXISTS "Users can view own KYC" ON kyc_verifications;

-- Remove old public insert policy (security risk)
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;

-- Remove old transaction insert policy if it exists
DROP POLICY IF EXISTS "Users can insert own transactions" ON transactions;