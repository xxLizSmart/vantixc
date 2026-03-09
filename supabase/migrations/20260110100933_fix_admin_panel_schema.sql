/*
  # Fix Admin Panel Schema

  1. Changes to `profiles` table
    - Add `kyc_status` field (text) with default 'not_verified'
    - Supports values: 'not_verified', 'pending', 'verified'
  
  2. Changes to `kyc_verifications` table
    - Add `full_name` field (text) - combines first, middle, last names
    - Add `country` field (text) - replaces continent
    - Add `id_front_photo_url` field (text) - front of ID
    - Add `id_back_photo_url` field (text) - back of ID
    
  3. Important Notes
    - This migration maintains backward compatibility
    - Existing data is preserved
    - Old fields are kept for legacy compatibility
*/

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

-- Add full_name to kyc_verifications table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'kyc_verifications' AND column_name = 'full_name'
  ) THEN
    ALTER TABLE kyc_verifications ADD COLUMN full_name text;
  END IF;
END $$;

-- Add country to kyc_verifications table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'kyc_verifications' AND column_name = 'country'
  ) THEN
    ALTER TABLE kyc_verifications ADD COLUMN country text;
  END IF;
END $$;

-- Add id_front_photo_url to kyc_verifications table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'kyc_verifications' AND column_name = 'id_front_photo_url'
  ) THEN
    ALTER TABLE kyc_verifications ADD COLUMN id_front_photo_url text;
  END IF;
END $$;

-- Add id_back_photo_url to kyc_verifications table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'kyc_verifications' AND column_name = 'id_back_photo_url'
  ) THEN
    ALTER TABLE kyc_verifications ADD COLUMN id_back_photo_url text;
  END IF;
END $$;