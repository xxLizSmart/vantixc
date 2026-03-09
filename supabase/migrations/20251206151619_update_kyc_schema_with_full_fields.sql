/*
  # Update KYC Schema for Complete Verification

  1. Changes to kyc_verifications table
    - Add full_name field to store complete name
    - Add country field for user's country
    - Add id_back_photo_url for back photo of ID
    - Rename id_photo_url to id_front_photo_url for clarity
    
  2. Changes to profiles table
    - Add kyc_status field (not_verified, pending, verified)
    - This allows quick lookup without joining tables
    
  3. Security
    - Maintain existing RLS policies
*/

-- Add new columns to kyc_verifications table
DO $$
BEGIN
  -- Add full_name if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'kyc_verifications' AND column_name = 'full_name'
  ) THEN
    ALTER TABLE kyc_verifications ADD COLUMN full_name text;
  END IF;

  -- Add country if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'kyc_verifications' AND column_name = 'country'
  ) THEN
    ALTER TABLE kyc_verifications ADD COLUMN country text;
  END IF;

  -- Add id_front_photo_url if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'kyc_verifications' AND column_name = 'id_front_photo_url'
  ) THEN
    ALTER TABLE kyc_verifications ADD COLUMN id_front_photo_url text;
  END IF;

  -- Add id_back_photo_url if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'kyc_verifications' AND column_name = 'id_back_photo_url'
  ) THEN
    ALTER TABLE kyc_verifications ADD COLUMN id_back_photo_url text;
  END IF;
END $$;

-- Add kyc_status to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'kyc_status'
  ) THEN
    ALTER TABLE profiles ADD COLUMN kyc_status text DEFAULT 'not_verified' CHECK (kyc_status IN ('not_verified', 'pending', 'verified'));
  END IF;
END $$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_kyc_status ON profiles(kyc_status);
CREATE INDEX IF NOT EXISTS idx_kyc_verifications_user_id ON kyc_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_verifications_status ON kyc_verifications(status);