-- Migration: Add phone index and normalize phone numbers
-- Description: Adds an index on the phone column for better query performance
--              and normalizes existing phone numbers to ensure consistency

-- Step 1: Add index on phone column for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone);

-- Step 2: Create a function to normalize phone numbers
-- This function strips all non-digit characters and ensures consistent format
CREATE OR REPLACE FUNCTION normalize_phone(phone_input TEXT)
RETURNS TEXT AS $$
BEGIN
  IF phone_input IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Remove all non-digit characters
  RETURN regexp_replace(phone_input, '\D', '', 'g');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Step 3: Add a normalized_phone column for faster lookups (optional but recommended)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS normalized_phone TEXT;

-- Step 4: Create an index on the normalized phone column
CREATE INDEX IF NOT EXISTS idx_profiles_normalized_phone ON profiles(normalized_phone);

-- Step 5: Populate normalized_phone for existing records
UPDATE profiles 
SET normalized_phone = normalize_phone(phone)
WHERE phone IS NOT NULL AND normalized_phone IS NULL;

-- Step 6: Create a trigger to automatically update normalized_phone when phone changes
CREATE OR REPLACE FUNCTION update_normalized_phone()
RETURNS TRIGGER AS $$
BEGIN
  NEW.normalized_phone := normalize_phone(NEW.phone);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_normalized_phone ON profiles;
CREATE TRIGGER trigger_update_normalized_phone
  BEFORE INSERT OR UPDATE OF phone ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_normalized_phone();

-- Step 7: Add comment for documentation
COMMENT ON COLUMN profiles.normalized_phone IS 'Phone number with all non-digit characters removed for consistent lookups';
COMMENT ON INDEX idx_profiles_phone IS 'Index for phone number lookups';
COMMENT ON INDEX idx_profiles_normalized_phone IS 'Index for normalized phone number lookups';
