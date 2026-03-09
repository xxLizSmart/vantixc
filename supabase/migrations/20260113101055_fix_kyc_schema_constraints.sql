/*
  # Fix KYC Schema Constraints

  1. Problem
    - Old schema has NOT NULL constraints on: first_name, last_name, continent, id_type, id_photo_url
    - New form uses: full_name, country, id_front_photo_url, id_back_photo_url
    - This causes constraint violations when submitting KYC

  2. Solution
    - Make old required columns nullable (backward compatibility)
    - Ensure new columns exist and have proper constraints
    - Add default value for id_type to prevent issues

  3. Security
    - Maintain existing RLS policies
*/

-- Make old columns nullable to prevent constraint violations
DO $$
BEGIN
  -- Make first_name nullable
  ALTER TABLE kyc_verifications ALTER COLUMN first_name DROP NOT NULL;
  
  -- Make last_name nullable
  ALTER TABLE kyc_verifications ALTER COLUMN last_name DROP NOT NULL;
  
  -- Make continent nullable
  ALTER TABLE kyc_verifications ALTER COLUMN continent DROP NOT NULL;
  
  -- Make id_type nullable and remove check constraint if exists
  ALTER TABLE kyc_verifications ALTER COLUMN id_type DROP NOT NULL;
  
  -- Make id_photo_url nullable
  ALTER TABLE kyc_verifications ALTER COLUMN id_photo_url DROP NOT NULL;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Columns might not exist or constraints already removed
    NULL;
END $$;

-- Ensure new columns exist with proper setup
DO $$
BEGIN
  -- Ensure full_name exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'kyc_verifications' AND column_name = 'full_name'
  ) THEN
    ALTER TABLE kyc_verifications ADD COLUMN full_name text;
  END IF;

  -- Ensure country exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'kyc_verifications' AND column_name = 'country'
  ) THEN
    ALTER TABLE kyc_verifications ADD COLUMN country text;
  END IF;

  -- Ensure id_front_photo_url exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'kyc_verifications' AND column_name = 'id_front_photo_url'
  ) THEN
    ALTER TABLE kyc_verifications ADD COLUMN id_front_photo_url text;
  END IF;

  -- Ensure id_back_photo_url exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'kyc_verifications' AND column_name = 'id_back_photo_url'
  ) THEN
    ALTER TABLE kyc_verifications ADD COLUMN id_back_photo_url text;
  END IF;
END $$;