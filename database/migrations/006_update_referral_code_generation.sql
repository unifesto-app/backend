-- Update referral code generation to use username from profiles
-- This migration updates the referral code generation to create codes from usernames

-- Drop existing function and trigger
DROP TRIGGER IF EXISTS on_auth_user_created_referral_code ON auth.users;
DROP FUNCTION IF EXISTS create_referral_code_for_new_user();
DROP FUNCTION IF EXISTS generate_referral_code(UUID);

-- New function to generate referral code from username
CREATE OR REPLACE FUNCTION generate_referral_code_from_username(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_username TEXT;
  v_name TEXT;
  v_code TEXT;
  v_base_code TEXT;
  v_suffix INTEGER;
  v_code_exists BOOLEAN;
BEGIN
  -- Get username or name from profiles
  SELECT username, name INTO v_username, v_name
  FROM profiles
  WHERE id = p_user_id;
  
  -- Use username if available, otherwise use name, otherwise use user_id
  IF v_username IS NOT NULL AND v_username != '' THEN
    v_base_code := UPPER(REGEXP_REPLACE(v_username, '[^a-zA-Z0-9]', '', 'g'));
  ELSIF v_name IS NOT NULL AND v_name != '' THEN
    -- Extract first name and remove special characters
    v_base_code := UPPER(REGEXP_REPLACE(SPLIT_PART(v_name, ' ', 1), '[^a-zA-Z0-9]', '', 'g'));
  ELSE
    -- Fallback to first 8 chars of user_id
    v_base_code := UPPER(SUBSTRING(p_user_id::TEXT, 1, 8));
  END IF;
  
  -- Ensure base code is not empty and has reasonable length
  IF v_base_code = '' OR LENGTH(v_base_code) < 3 THEN
    v_base_code := UPPER(SUBSTRING(p_user_id::TEXT, 1, 8));
  END IF;
  
  -- Limit base code to 12 characters
  v_base_code := SUBSTRING(v_base_code, 1, 12);
  
  -- Try base code first
  v_code := v_base_code;
  SELECT EXISTS(SELECT 1 FROM referral_codes WHERE code = v_code) INTO v_code_exists;
  
  -- If code exists, add numeric suffix
  IF v_code_exists THEN
    v_suffix := 1;
    LOOP
      v_code := v_base_code || v_suffix::TEXT;
      SELECT EXISTS(SELECT 1 FROM referral_codes WHERE code = v_code) INTO v_code_exists;
      
      EXIT WHEN NOT v_code_exists;
      
      v_suffix := v_suffix + 1;
      
      -- Safety check to prevent infinite loop
      IF v_suffix > 9999 THEN
        -- Use random suffix if we've tried too many
        v_code := v_base_code || FLOOR(RANDOM() * 100000)::TEXT;
        EXIT;
      END IF;
    END LOOP;
  END IF;
  
  RETURN v_code;
END;
$$ LANGUAGE plpgsql;

-- Function to create referral code for new user (called by trigger)
CREATE OR REPLACE FUNCTION create_referral_code_for_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_code TEXT;
BEGIN
  -- Generate referral code
  v_code := generate_referral_code_from_username(NEW.id);
  
  -- Insert referral code
  INSERT INTO referral_codes (user_id, code, total_referrals, total_rewards, is_active)
  VALUES (NEW.id, v_code, 0, 0, TRUE)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created_referral_code
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_referral_code_for_new_user();

-- Function to manually regenerate referral code for existing user
CREATE OR REPLACE FUNCTION regenerate_referral_code(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_new_code TEXT;
BEGIN
  -- Generate new code
  v_new_code := generate_referral_code_from_username(p_user_id);
  
  -- Update existing code
  UPDATE referral_codes
  SET code = v_new_code, updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- If no row was updated, insert new one
  IF NOT FOUND THEN
    INSERT INTO referral_codes (user_id, code, total_referrals, total_rewards, is_active)
    VALUES (p_user_id, v_new_code, 0, 0, TRUE);
  END IF;
  
  RETURN v_new_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment
COMMENT ON FUNCTION generate_referral_code_from_username IS 'Generates unique referral code from username or name, alphanumeric only';
COMMENT ON FUNCTION regenerate_referral_code IS 'Manually regenerate referral code for existing user';
