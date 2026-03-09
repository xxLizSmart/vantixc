/*
  # Fix KYC Schema Conflicts

  1. Changes
    - Make old required fields nullable or provide defaults
    - Keep both old and new fields for backward compatibility
    - Allow form to work with either field set

  2. Details
    - first_name, last_name, continent, id_type, id_photo_url made nullable
    - This allows the form to use either the old or new field structure
*/

-- Make old required fields nullable to avoid conflicts
ALTER TABLE kyc_verifications 
  ALTER COLUMN first_name DROP NOT NULL,
  ALTER COLUMN last_name DROP NOT NULL,
  ALTER COLUMN continent DROP NOT NULL,
  ALTER COLUMN id_type DROP NOT NULL,
  ALTER COLUMN id_photo_url DROP NOT NULL;

-- Set default empty values for existing NOT NULL constraints where needed
UPDATE kyc_verifications 
SET 
  first_name = COALESCE(first_name, split_part(full_name, ' ', 1)),
  last_name = COALESCE(last_name, split_part(full_name, ' ', -1)),
  continent = COALESCE(continent, 'Unknown'),
  id_type = COALESCE(id_type, 'National ID'),
  id_photo_url = COALESCE(id_photo_url, id_front_photo_url, '')
WHERE first_name IS NULL OR last_name IS NULL OR continent IS NULL OR id_type IS NULL OR id_photo_url IS NULL;