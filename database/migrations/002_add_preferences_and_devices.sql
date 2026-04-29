-- Migration: Add preferences, last_login, and device tracking
-- Created: 2026-04-29

-- ============================================
-- 1. Add preferences and last_login to profiles table
-- ============================================

-- Add preferences column (JSONB for flexible preference storage)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{
  "push_notifications": true,
  "email_notifications": true,
  "event_reminders": true,
  "marketing_emails": false
}'::jsonb;

-- Add last_login column
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;

-- Add index for last_login queries
CREATE INDEX IF NOT EXISTS idx_profiles_last_login ON profiles(last_login DESC);

-- ============================================
-- 2. Create user_devices table for device tracking
-- ============================================

CREATE TABLE IF NOT EXISTS user_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_name TEXT NOT NULL,
  device_type TEXT NOT NULL CHECK (device_type IN ('ios', 'android', 'web', 'desktop', 'unknown')),
  device_model TEXT,
  os_version TEXT,
  app_version TEXT,
  device_token TEXT, -- For push notifications
  device_fingerprint TEXT UNIQUE, -- Unique identifier for the device
  ip_address TEXT,
  user_agent TEXT,
  last_active TIMESTAMPTZ DEFAULT NOW(),
  first_seen TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for user_devices
CREATE INDEX IF NOT EXISTS idx_user_devices_user_id ON user_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_user_devices_last_active ON user_devices(last_active DESC);
CREATE INDEX IF NOT EXISTS idx_user_devices_device_fingerprint ON user_devices(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_user_devices_is_active ON user_devices(is_active) WHERE is_active = true;

-- ============================================
-- 3. Enable Row Level Security (RLS)
-- ============================================

ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own devices
CREATE POLICY "Users can view own devices"
ON user_devices
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Users can insert their own devices
CREATE POLICY "Users can insert own devices"
ON user_devices
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own devices
CREATE POLICY "Users can update own devices"
ON user_devices
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Users can delete their own devices
CREATE POLICY "Users can delete own devices"
ON user_devices
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ============================================
-- 4. Create function to update last_active timestamp
-- ============================================

CREATE OR REPLACE FUNCTION update_device_last_active()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for user_devices
DROP TRIGGER IF EXISTS trigger_update_device_last_active ON user_devices;
CREATE TRIGGER trigger_update_device_last_active
  BEFORE UPDATE ON user_devices
  FOR EACH ROW
  EXECUTE FUNCTION update_device_last_active();

-- ============================================
-- 5. Create function to update profile last_login
-- ============================================

CREATE OR REPLACE FUNCTION update_profile_last_login(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET last_login = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. Create view for active devices summary
-- ============================================

CREATE OR REPLACE VIEW user_devices_summary AS
SELECT 
  user_id,
  COUNT(*) as total_devices,
  COUNT(*) FILTER (WHERE is_active = true) as active_devices,
  MAX(last_active) as last_device_activity,
  array_agg(
    jsonb_build_object(
      'id', id,
      'device_name', device_name,
      'device_type', device_type,
      'last_active', last_active,
      'is_active', is_active
    ) ORDER BY last_active DESC
  ) as devices
FROM user_devices
GROUP BY user_id;

-- Grant access to authenticated users
GRANT SELECT ON user_devices_summary TO authenticated;

-- ============================================
-- 7. Add comments for documentation
-- ============================================

COMMENT ON COLUMN profiles.preferences IS 'User notification and app preferences stored as JSONB';
COMMENT ON COLUMN profiles.last_login IS 'Timestamp of user last login/authentication';
COMMENT ON TABLE user_devices IS 'Tracks devices that users have logged in from';
COMMENT ON COLUMN user_devices.device_fingerprint IS 'Unique identifier for the device (hash of device info)';
COMMENT ON COLUMN user_devices.device_token IS 'Push notification token (OneSignal, FCM, etc.)';
COMMENT ON COLUMN user_devices.is_active IS 'Whether the device is currently active (not logged out)';

-- ============================================
-- 8. Sample data for testing (optional - comment out in production)
-- ============================================

-- Update existing profiles with default preferences
UPDATE profiles 
SET preferences = '{
  "push_notifications": true,
  "email_notifications": true,
  "event_reminders": true,
  "marketing_emails": false
}'::jsonb
WHERE preferences IS NULL;

-- ============================================
-- Migration complete
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Migration 002 completed successfully!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Added:';
  RAISE NOTICE '- profiles.preferences (JSONB)';
  RAISE NOTICE '- profiles.last_login (TIMESTAMPTZ)';
  RAISE NOTICE '- user_devices table';
  RAISE NOTICE '- RLS policies for user_devices';
  RAISE NOTICE '- Functions and triggers';
  RAISE NOTICE '- user_devices_summary view';
  RAISE NOTICE '========================================';
END $$;
