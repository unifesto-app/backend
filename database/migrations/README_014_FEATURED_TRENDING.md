# Migration 014: Add Featured and Trending Columns to Events

## Issue
The events table is missing `is_featured` and `is_trending` columns that are required by:
- Backend API (`/api/events/featured`, `/api/events/trending`)
- Admin dashboard (event management with featured/trending filters)
- Mobile app (featured and trending events sections)

## Error
```
Could not find the 'is_featured' column of 'events' in the schema cache
```

## Solution
Run migration `014_add_featured_trending_to_events.sql` to add the missing columns.

## How to Run

### Option 1: Using Supabase Dashboard (RECOMMENDED)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `RUN_014_ADD_FEATURED_TRENDING.sql`
4. Paste and execute
5. Check the output to verify columns were added

### Option 2: Using psql
```bash
psql -h <your-supabase-host> -U postgres -d postgres -f database/migrations/014_add_featured_trending_to_events.sql
```

### Option 3: Using Supabase CLI
```bash
supabase db push
```

## What This Migration Does

1. **Adds `is_featured` column**
   - Type: BOOLEAN
   - Default: FALSE
   - Not nullable
   - Purpose: Mark events to display in featured section

2. **Adds `is_trending` column**
   - Type: BOOLEAN
   - Default: FALSE
   - Not nullable
   - Purpose: Mark events to display in trending section

3. **Creates indexes** for better query performance:
   - `idx_events_is_featured` - For featured events queries
   - `idx_events_is_trending` - For trending events queries
   - `idx_events_published_featured` - For published featured events
   - `idx_events_published_trending` - For published trending events

## Verification
After running the migration, verify it worked:

```sql
-- Check the columns exist
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'events' 
AND column_name IN ('is_featured', 'is_trending')
ORDER BY column_name;

-- Should return:
-- is_featured | boolean | false | NO
-- is_trending | boolean | false | NO
```

## Test the Feature
After migration:

1. **Admin Dashboard**: Go to Events Management
   - Select events and click "Mark as Featured" or "Mark as Trending"
   - Filter by "Featured Events" or "Trending Events"

2. **Mobile App**: Check HomeScreen
   - Featured events section should load
   - Trending events section should load

3. **API Endpoints**:
   - `GET /api/events/featured` - Get featured events
   - `POST /api/events/featured` - Mark events as featured
   - `DELETE /api/events/featured` - Remove featured status
   - `GET /api/events/trending` - Get trending events
   - `POST /api/events/trending` - Mark events as trending
   - `DELETE /api/events/trending` - Remove trending status

## Rollback (if needed)
```sql
-- Remove columns
ALTER TABLE events DROP COLUMN IF EXISTS is_featured;
ALTER TABLE events DROP COLUMN IF EXISTS is_trending;

-- Remove indexes
DROP INDEX IF EXISTS idx_events_is_featured;
DROP INDEX IF EXISTS idx_events_is_trending;
DROP INDEX IF EXISTS idx_events_published_featured;
DROP INDEX IF EXISTS idx_events_published_trending;
```
