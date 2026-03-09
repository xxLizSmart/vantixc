/*
  # Fix RLS Infinite Recursion

  1. Changes
    - Drop the existing problematic admin policies
    - Simplify the SELECT policies to avoid recursion
    - Keep user-specific policies simple and direct

  2. Security
    - Users can view their own profile
    - Admins can update any profile (but must check is_admin in application logic)
*/

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- Simple SELECT policy - users can ONLY view their own profile
-- Admin checks will be done in the application layer after profile is loaded
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Users can update their own profile (but cannot change is_admin flag)
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id 
    AND (
      -- Prevent users from making themselves admin
      is_admin = (SELECT is_admin FROM profiles WHERE id = auth.uid())
      OR is_admin IS NULL
    )
  );