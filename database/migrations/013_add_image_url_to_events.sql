-- Migration: Add image_url column to events table
-- Description: Add support for event images with URL storage

-- Add image_url column to events table
ALTER TABLE events
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add comment
COMMENT ON COLUMN events.image_url IS 'URL of the event image (4:3 aspect ratio recommended)';

-- Create index for faster queries (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_events_image_url ON events(image_url) WHERE image_url IS NOT NULL;
