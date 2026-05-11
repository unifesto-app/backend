# Migration 015: Add Missing Event Columns

## Issue
The events table is missing many columns that the API expects, causing 500 errors when fetching events.

**Error:**
```
ERROR [API] Error fetching event: 500
```

## Root Cause
The events table was created with only basic columns:
- id, title, description, organization_id
- start_date, end_date, location
- status, created_at, updated_at

But the API expects many more fields:
- slug, short_description
- banner_url, thumbnail_url, image_url
- registration_start, registration_end
- venue, city, state, country
- event_type, category, tags
- max_attendees
- is_free, price, currency
- is_featured, is_trending

## Solution
Run migration `015_add_missing_event_columns.sql` to add all missing columns.

## How to Run

### Option 1: Using Supabase Dashboard (RECOMMENDED)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `RUN_015_ADD_MISSING_COLUMNS.sql`
4. Paste and execute
5. Check the output to verify columns were added

### Option 2: Using psql
```bash
psql -h <your-supabase-host> -U postgres -d postgres -f database/migrations/015_add_missing_event_columns.sql
```

## What This Migration Does

### 1. Adds Content Fields
- `slug` - URL-friendly identifier (UNIQUE)
- `short_description` - Brief description for cards
- `banner_url` - Main banner image
- `thumbnail_url` - Thumbnail for cards
- `image_url` - Already added in migration 013

### 2. Adds Registration Fields
- `registration_start` - When registration opens
- `registration_end` - When registration closes

### 3. Adds Location Fields
- `venue` - Specific venue name
- `city` - City name
- `state` - State/Province
- `country` - Country (default: 'India')

### 4. Adds Event Classification
- `event_type` - online | offline | hybrid (default: 'offline')
- `category` - Event category (Tech, Music, Sports, etc.)
- `tags` - JSONB array for filtering

### 5. Adds Capacity & Pricing
- `max_attendees` - Maximum attendees allowed
- `is_free` - Boolean (default: TRUE)
- `price` - Decimal price (default: 0)
- `currency` - Currency code (default: 'INR')

### 6. Adds Feature Flags
- `is_featured` - Already added in migration 014
- `is_trending` - Already added in migration 014

### 7. Creates Indexes
- Single column indexes for common queries
- Composite indexes for filtered queries
- GIN index for JSONB tags
- Partial indexes for published events

## Verification
After running the migration, verify it worked:

```sql
-- Check all columns exist
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'events'
ORDER BY ordinal_position;

-- Check indexes were created
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'events'
ORDER BY indexname;
```

## Test the API
After migration:

1. **Backend**: Restart the backend server
   ```bash
   cd backend
   npm run start:dev
   ```

2. **Test Endpoints**:
   - `GET /public/events` - Should return events list
   - `GET /public/events/:id` - Should return single event
   - `GET /public/events/featured` - Should return featured events
   - `GET /public/events/trending` - Should return trending events

3. **Mobile App**: Should now load events without 500 errors

## Default Values
New columns have sensible defaults:
- `event_type`: 'offline'
- `country`: 'India'
- `is_free`: TRUE
- `price`: 0
- `currency`: 'INR'
- `tags`: []

Existing events will get these defaults automatically.

## Rollback (if needed)
```sql
-- Remove all added columns
ALTER TABLE events 
  DROP COLUMN IF EXISTS slug,
  DROP COLUMN IF EXISTS short_description,
  DROP COLUMN IF EXISTS banner_url,
  DROP COLUMN IF EXISTS thumbnail_url,
  DROP COLUMN IF EXISTS registration_start,
  DROP COLUMN IF EXISTS registration_end,
  DROP COLUMN IF EXISTS venue,
  DROP COLUMN IF EXISTS city,
  DROP COLUMN IF EXISTS state,
  DROP COLUMN IF EXISTS country,
  DROP COLUMN IF EXISTS event_type,
  DROP COLUMN IF EXISTS category,
  DROP COLUMN IF EXISTS tags,
  DROP COLUMN IF EXISTS max_attendees,
  DROP COLUMN IF EXISTS is_free,
  DROP COLUMN IF EXISTS price,
  DROP COLUMN IF EXISTS currency;

-- Remove indexes
DROP INDEX IF EXISTS idx_events_slug;
DROP INDEX IF EXISTS idx_events_city;
DROP INDEX IF EXISTS idx_events_category;
DROP INDEX IF EXISTS idx_events_event_type;
DROP INDEX IF EXISTS idx_events_is_free;
DROP INDEX IF EXISTS idx_events_start_date;
DROP INDEX IF EXISTS idx_events_tags;
DROP INDEX IF EXISTS idx_events_published_start;
DROP INDEX IF EXISTS idx_events_city_status;
DROP INDEX IF EXISTS idx_events_category_status;
```

## Next Steps
After running this migration:
1. ✅ Backend API will work properly
2. ✅ Mobile app will load events
3. ✅ Admin/Organizer dashboards can create full events
4. ⚠️ You may want to populate existing events with proper data
