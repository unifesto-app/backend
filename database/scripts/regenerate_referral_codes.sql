-- Script to regenerate referral codes for existing users
-- Run this after applying migration 006_update_referral_code_generation.sql

-- First, check how many users need code regeneration
SELECT 
  COUNT(*) as total_users,
  COUNT(rc.code) as users_with_codes,
  COUNT(*) - COUNT(rc.code) as users_without_codes
FROM auth.users u
LEFT JOIN referral_codes rc ON u.id = rc.user_id;

-- Show current codes (before regeneration)
SELECT 
  u.id,
  p.username,
  p.name,
  rc.code as current_code,
  rc.total_referrals,
  rc.total_rewards
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
LEFT JOIN referral_codes rc ON u.id = rc.user_id
ORDER BY u.created_at DESC
LIMIT 10;

-- Regenerate codes for all users
-- This will update existing codes to be username-based
DO $$
DECLARE
  user_record RECORD;
  new_code TEXT;
  updated_count INTEGER := 0;
  created_count INTEGER := 0;
BEGIN
  FOR user_record IN 
    SELECT id FROM auth.users
  LOOP
    BEGIN
      -- Try to regenerate code
      new_code := regenerate_referral_code(user_record.id);
      
      -- Check if it was an update or insert
      IF EXISTS (SELECT 1 FROM referral_codes WHERE user_id = user_record.id) THEN
        updated_count := updated_count + 1;
      ELSE
        created_count := created_count + 1;
      END IF;
      
      RAISE NOTICE 'User %: Generated code %', user_record.id, new_code;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error for user %: %', user_record.id, SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE 'Regeneration complete: % updated, % created', updated_count, created_count;
END $$;

-- Verify new codes (after regeneration)
SELECT 
  u.id,
  p.username,
  p.name,
  rc.code as new_code,
  rc.total_referrals,
  rc.total_rewards,
  rc.updated_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
LEFT JOIN referral_codes rc ON u.id = rc.user_id
ORDER BY rc.updated_at DESC
LIMIT 10;

-- Check for any duplicate codes (should be none)
SELECT 
  code,
  COUNT(*) as count
FROM referral_codes
GROUP BY code
HAVING COUNT(*) > 1;

-- Summary statistics
SELECT 
  'Total Users' as metric,
  COUNT(*) as value
FROM auth.users
UNION ALL
SELECT 
  'Users with Codes',
  COUNT(*)
FROM referral_codes
UNION ALL
SELECT 
  'Active Codes',
  COUNT(*)
FROM referral_codes
WHERE is_active = TRUE
UNION ALL
SELECT 
  'Total Referrals',
  SUM(total_referrals)
FROM referral_codes
UNION ALL
SELECT 
  'Total Rewards Distributed',
  SUM(total_rewards)
FROM referral_codes;
