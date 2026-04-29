-- Migration 003: Add Device Token Constraints and Indexes
-- Date: April 29, 2026
-- Purpose: Ensure device tokens are unique and indexed for performance

-- 1. Add unique constraint on device_token across all devices
ALTER TABLE user_devices
ADD CONSTRAINT unique_device_token UNIQUE(device_token);

-- 2. Create composite index for faster device lookups by user and fingerprint
CREATE INDEX idx_user_devices_fingerprint 
ON user_devices(user_id, device_fingerprint);

-- 3. Create index on device_token for reverse lookups (find user by token)
CREATE INDEX idx_device_token 
ON user_devices(device_token);

-- 4. Create index on is_active for filtering active devices
CREATE INDEX idx_device_active 
ON user_devices(user_id, is_active);

-- 5. Create index on last_active for sorting
CREATE INDEX idx_device_last_active 
ON user_devices(user_id, last_active DESC);

-- 6. Add NOT NULL constraint to device_token (execute AFTER backfilling any NULL values)
-- First, backfill any NULL tokens with UUIDs
UPDATE user_devices 
SET device_token = gen_random_uuid()::text 
WHERE device_token IS NULL;

-- Then apply the constraint
ALTER TABLE user_devices
ALTER COLUMN device_token SET NOT NULL;

-- 7. Verify migration results
-- Select to verify all devices have tokens
SELECT 
  id,
  user_id,
  device_name,
  device_token,
  created_at
FROM user_devices
WHERE device_token IS NULL
LIMIT 10;

-- Expected result: 0 rows with NULL tokens
