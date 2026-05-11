-- Migration: Update Profile Roles
-- Description: Add 'organizer' and 'admin' roles to profiles table
-- Date: 2026-05-10
-- Migration Number: 011

-- Drop the existing constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add new constraint with all roles
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('attendee', 'organizer', 'admin', 'super_admin', 'support'));

-- Update any existing 'support' roles to 'admin' (if needed)
UPDATE profiles SET role = 'admin' WHERE role = 'support';

-- Add comment
COMMENT ON COLUMN profiles.role IS 'Platform-level role: attendee, organizer, admin, super_admin';
