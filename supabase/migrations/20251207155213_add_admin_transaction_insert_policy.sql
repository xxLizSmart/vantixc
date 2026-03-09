/*
  # Add Admin Transaction Insert Policy

  1. Changes
    - Add policy to allow admins to insert transactions for any user
    - This is needed when admins approve deposits/withdrawals and need to create transaction records

  2. Security
    - Policy only grants access to users with is_admin = true
    - Maintains secure access control while allowing admin functionality
*/

-- Add policy for admins to insert transactions for any user
CREATE POLICY "Admins can insert transactions for any user"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );