-- Migration: Add automatic profile creation trigger
-- This ensures a profile is created immediately when a user signs up

-- Function to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION create_profile_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert profile for new user
  INSERT INTO profiles (
    id,
    email,
    role,
    is_verified,
    is_active,
    is_banned,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    'attendee',
    false,
    true,
    false,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;

-- Create trigger to run BEFORE wallet and referral code triggers
-- This ensures profile exists before other triggers run
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_profile_for_new_user();

-- Comment for documentation
COMMENT ON FUNCTION create_profile_for_new_user() IS 'Automatically creates a profile entry when a new user signs up via Supabase Auth';
