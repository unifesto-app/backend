-- Migration to remove wallet passcode feature
-- This removes the wallet_passcode column from profiles table and drops the wallet_otps table

-- Drop wallet_otps policies first (only if table exists; CASCADE on DROP TABLE would handle it otherwise)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wallet_otps') THEN
    DROP POLICY IF EXISTS "Users can view their own wallet OTPs" ON wallet_otps;
    DROP POLICY IF EXISTS "Users can insert their own wallet OTPs" ON wallet_otps;
    DROP POLICY IF EXISTS "Users can update their own wallet OTPs" ON wallet_otps;
  END IF;
END $$;

-- Drop wallet_otps table (used for OTP verification)
DROP TABLE IF EXISTS wallet_otps CASCADE;

-- Remove wallet_passcode column from profiles table
ALTER TABLE profiles DROP COLUMN IF EXISTS wallet_passcode;

-- Remove wallet passcode related functions from auth schema if they exist
DROP FUNCTION IF EXISTS auth.request_wallet_otp(TEXT);
DROP FUNCTION IF EXISTS auth.verify_wallet_otp(TEXT, TEXT);
DROP FUNCTION IF EXISTS auth.set_wallet_passcode(TEXT, TEXT);
DROP FUNCTION IF EXISTS auth.verify_wallet_passcode(TEXT);
DROP FUNCTION IF EXISTS auth.has_wallet_passcode();

-- Add a comment to document the removal
COMMENT ON TABLE profiles IS 'User profiles with unified role system. Wallet passcode feature removed in migration 008.';
