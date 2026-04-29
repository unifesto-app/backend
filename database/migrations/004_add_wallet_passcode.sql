-- Add wallet_passcode column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS wallet_passcode TEXT;

-- Create wallet_otps table for OTP verification
CREATE TABLE IF NOT EXISTS wallet_otps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  otp TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_wallet_otps_user_id ON wallet_otps(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_otps_token ON wallet_otps(token);
CREATE INDEX IF NOT EXISTS idx_wallet_otps_email ON wallet_otps(email);

-- Enable RLS
ALTER TABLE wallet_otps ENABLE ROW LEVEL SECURITY;

-- RLS Policies for wallet_otps
CREATE POLICY "Users can view their own OTPs"
  ON wallet_otps FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own OTPs"
  ON wallet_otps FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own OTPs"
  ON wallet_otps FOR UPDATE
  USING (auth.uid() = user_id);

-- Add comment
COMMENT ON TABLE wallet_otps IS 'Stores OTPs for wallet passcode verification';
COMMENT ON COLUMN profiles.wallet_passcode IS 'Hashed wallet passcode for additional security';
