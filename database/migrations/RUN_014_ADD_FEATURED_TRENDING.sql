-- ============================================
-- QUICK FIX: Add is_featured and is_trending columns to events
-- ============================================
-- Run this in Supabase SQL Editor
-- ============================================

-- Add is_featured column to events table
ALTER TABLE events
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE NOT NULL;

-- Add is_trending column to events table
ALTER TABLE events
ADD COLUMN IF NOT EXISTS is_trending BOOLEAN DEFAULT FALSE NOT NULL;

-- Add comments
COMMENT ON COLUMN events.is_featured IS 'Whether the event is featured on the homepage';
COMMENT ON COLUMN events.is_trending IS 'Whether the event is currently trending';

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_events_is_featured ON events(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_events_is_trending ON events(is_trending) WHERE is_trending = TRUE;

-- Create composite index for published featured events
CREATE INDEX IF NOT EXISTS idx_events_published_featured ON events(status, is_featured) 
WHERE status = 'published' AND is_featured = TRUE;

-- Create composite index for published trending events
CREATE INDEX IF NOT EXISTS idx_events_published_trending ON events(status, is_trending) 
WHERE status = 'published' AND is_trending = TRUE;

-- Verify the columns were added
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'events' 
AND column_name IN ('is_featured', 'is_trending')
ORDER BY column_name;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Migration completed successfully!';
  RAISE NOTICE 'Added is_featured and is_trending columns to events table';
END $$;
