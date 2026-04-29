-- Migration: Enable Realtime for user_devices table
-- Created: 2026-04-29
-- Purpose: Allow real-time device status updates for instant logout

-- ============================================
-- Enable Realtime for user_devices table
-- ============================================

-- Add user_devices table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE user_devices;

-- Verify it was added
DO $
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'user_devices'
  ) THEN
    RAISE NOTICE '✅ Realtime enabled for user_devices table';
  ELSE
    RAISE WARNING '❌ Failed to enable realtime for user_devices table';
  END IF;
END $;

-- ============================================
-- Verify RLS policies are correct
-- ============================================

-- Ensure users can view their own devices (required for realtime)
DO $
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_devices' 
    AND policyname = 'Users can view own devices'
  ) THEN
    RAISE NOTICE '✅ RLS policy "Users can view own devices" exists';
  ELSE
    RAISE WARNING '❌ RLS policy "Users can view own devices" not found';
    RAISE NOTICE 'Creating policy...';
    
    EXECUTE '
      CREATE POLICY "Users can view own devices"
      ON user_devices
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id)
    ';
    
    RAISE NOTICE '✅ RLS policy created';
  END IF;
END $;

-- ============================================
-- Test realtime setup
-- ============================================

DO $
DECLARE
  realtime_enabled BOOLEAN;
  rls_enabled BOOLEAN;
  policy_count INTEGER;
BEGIN
  -- Check if realtime is enabled
  SELECT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'user_devices'
  ) INTO realtime_enabled;
  
  -- Check if RLS is enabled
  SELECT relrowsecurity 
  FROM pg_class 
  WHERE relname = 'user_devices' 
  INTO rls_enabled;
  
  -- Count policies
  SELECT COUNT(*) 
  FROM pg_policies 
  WHERE tablename = 'user_devices' 
  INTO policy_count;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Realtime Setup Verification';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Realtime enabled: %', realtime_enabled;
  RAISE NOTICE 'RLS enabled: %', rls_enabled;
  RAISE NOTICE 'Number of policies: %', policy_count;
  RAISE NOTICE '========================================';
  
  IF realtime_enabled AND rls_enabled AND policy_count >= 4 THEN
    RAISE NOTICE '✅ All checks passed! Realtime should work.';
  ELSE
    RAISE WARNING '⚠️  Some checks failed. Realtime might not work properly.';
  END IF;
END $;

-- ============================================
-- Migration complete
-- ============================================

DO $
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Migration 003 completed successfully!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Enabled:';
  RAISE NOTICE '- Realtime for user_devices table';
  RAISE NOTICE '- RLS policies verified';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Restart your mobile app';
  RAISE NOTICE '2. Test device removal';
  RAISE NOTICE '3. Check for realtime events in logs';
  RAISE NOTICE '========================================';
END $;
