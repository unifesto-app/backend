-- ============================================
-- DATABASE VERIFICATION SCRIPT
-- ============================================
-- Run this to check if all required columns exist
-- ============================================

-- Check events table columns
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'events'
ORDER BY ordinal_position;

-- Check for required columns
DO $$
DECLARE
  missing_columns TEXT[] := ARRAY[]::TEXT[];
  required_columns TEXT[] := ARRAY[
    'id', 'title', 'slug', 'description', 'short_description',
    'banner_url', 'thumbnail_url', 'image_url',
    'start_date', 'end_date', 'registration_start', 'registration_end',
    'location', 'venue', 'city', 'state', 'country',
    'event_type', 'category', 'tags',
    'max_attendees', 'is_free', 'price', 'currency',
    'status', 'is_featured', 'is_trending',
    'organization_id', 'created_at', 'updated_at'
  ];
  col TEXT;
  col_exists BOOLEAN;
BEGIN
  FOREACH col IN ARRAY required_columns
  LOOP
    SELECT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'events' 
      AND column_name = col
    ) INTO col_exists;
    
    IF NOT col_exists THEN
      missing_columns := array_append(missing_columns, col);
    END IF;
  END LOOP;
  
  IF array_length(missing_columns, 1) > 0 THEN
    RAISE WARNING 'Missing columns: %', array_to_string(missing_columns, ', ');
    RAISE WARNING 'Run Migration 015 to add missing columns';
  ELSE
    RAISE NOTICE 'All required columns exist!';
  END IF;
END $$;

-- Check indexes
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'events'
ORDER BY indexname;

-- Check sample event data
SELECT 
  id,
  title,
  slug,
  event_type,
  category,
  city,
  is_free,
  is_featured,
  is_trending,
  status,
  start_date
FROM events
LIMIT 5;

-- Count events by status
SELECT 
  status,
  COUNT(*) as count
FROM events
GROUP BY status
ORDER BY count DESC;

-- Count featured and trending events
SELECT 
  'Featured' as type,
  COUNT(*) as count
FROM events
WHERE is_featured = true AND status = 'published'
UNION ALL
SELECT 
  'Trending' as type,
  COUNT(*) as count
FROM events
WHERE is_trending = true AND status = 'published'
UNION ALL
SELECT 
  'Published' as type,
  COUNT(*) as count
FROM events
WHERE status = 'published';
