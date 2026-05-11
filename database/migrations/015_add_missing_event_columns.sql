-- Migration: Add missing columns to events table
-- Description: Add all missing columns required by the API

-- Add slug column
ALTER TABLE events
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Add short_description column
ALTER TABLE events
ADD COLUMN IF NOT EXISTS short_description TEXT;

-- Add banner and thumbnail URLs
ALTER TABLE events
ADD COLUMN IF NOT EXISTS banner_url TEXT;

ALTER TABLE events
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- Add registration dates
ALTER TABLE events
ADD COLUMN IF NOT EXISTS registration_start TIMESTAMPTZ;

ALTER TABLE events
ADD COLUMN IF NOT EXISTS registration_end TIMESTAMPTZ;

-- Add location details
ALTER TABLE events
ADD COLUMN IF NOT EXISTS venue TEXT;

ALTER TABLE events
ADD COLUMN IF NOT EXISTS city TEXT;

ALTER TABLE events
ADD COLUMN IF NOT EXISTS state TEXT;

ALTER TABLE events
ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'India';

-- Add event type
ALTER TABLE events
ADD COLUMN IF NOT EXISTS event_type TEXT DEFAULT 'offline'
  CHECK (event_type IN ('online', 'offline', 'hybrid'));

-- Add category
ALTER TABLE events
ADD COLUMN IF NOT EXISTS category TEXT;

-- Add tags (JSON array)
ALTER TABLE events
ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;

-- Add attendee limit
ALTER TABLE events
ADD COLUMN IF NOT EXISTS max_attendees INTEGER;

-- Add pricing
ALTER TABLE events
ADD COLUMN IF NOT EXISTS is_free BOOLEAN DEFAULT TRUE NOT NULL;

ALTER TABLE events
ADD COLUMN IF NOT EXISTS price DECIMAL(10, 2) DEFAULT 0;

ALTER TABLE events
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'INR';

-- Add comments
COMMENT ON COLUMN events.slug IS 'URL-friendly slug for the event';
COMMENT ON COLUMN events.short_description IS 'Brief description for cards and previews';
COMMENT ON COLUMN events.banner_url IS 'Main banner image URL';
COMMENT ON COLUMN events.thumbnail_url IS 'Thumbnail image URL for cards';
COMMENT ON COLUMN events.registration_start IS 'When registration opens';
COMMENT ON COLUMN events.registration_end IS 'When registration closes';
COMMENT ON COLUMN events.venue IS 'Specific venue name';
COMMENT ON COLUMN events.city IS 'City where event takes place';
COMMENT ON COLUMN events.state IS 'State/Province';
COMMENT ON COLUMN events.country IS 'Country';
COMMENT ON COLUMN events.event_type IS 'Type of event: online, offline, or hybrid';
COMMENT ON COLUMN events.category IS 'Event category (e.g., Tech, Music, Sports)';
COMMENT ON COLUMN events.tags IS 'Array of tags for filtering';
COMMENT ON COLUMN events.max_attendees IS 'Maximum number of attendees allowed';
COMMENT ON COLUMN events.is_free IS 'Whether the event is free';
COMMENT ON COLUMN events.price IS 'Ticket price if not free';
COMMENT ON COLUMN events.currency IS 'Currency code (e.g., INR, USD)';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_events_slug ON events(slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_events_city ON events(city) WHERE city IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category) WHERE category IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_events_event_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_is_free ON events(is_free);
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_tags ON events USING GIN (tags);

-- Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_events_published_start ON events(status, start_date) 
WHERE status = 'published';

CREATE INDEX IF NOT EXISTS idx_events_city_status ON events(city, status) 
WHERE status = 'published';

CREATE INDEX IF NOT EXISTS idx_events_category_status ON events(category, status) 
WHERE status = 'published';
