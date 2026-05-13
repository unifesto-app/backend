-- Migration: Create Event Additional Info Tables
-- Description: Tables for event agenda, speakers, prizes, and FAQs
-- Date: 2026-05-13

-- =====================================================
-- EVENT AGENDA TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS event_agenda (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  location VARCHAR(255),
  speaker_ids UUID[], -- Array of speaker IDs
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Index for faster queries
CREATE INDEX idx_event_agenda_event_id ON event_agenda(event_id);
CREATE INDEX idx_event_agenda_start_time ON event_agenda(start_time);

-- =====================================================
-- EVENT SPEAKERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS event_speakers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  title VARCHAR(255), -- Job title or role
  bio TEXT,
  profile_image_url TEXT,
  email VARCHAR(255),
  phone VARCHAR(50),
  social_links JSONB DEFAULT '{}', -- {linkedin, twitter, website, etc}
  display_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Index for faster queries
CREATE INDEX idx_event_speakers_event_id ON event_speakers(event_id);
CREATE INDEX idx_event_speakers_featured ON event_speakers(event_id, is_featured);

-- =====================================================
-- EVENT PRIZES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS event_prizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  value VARCHAR(100), -- e.g., "$1000", "Trophy + Certificate"
  prize_type VARCHAR(50), -- 'cash', 'trophy', 'certificate', 'product', 'other'
  position INTEGER, -- 1st, 2nd, 3rd place, etc.
  quantity INTEGER DEFAULT 1,
  image_url TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Index for faster queries
CREATE INDEX idx_event_prizes_event_id ON event_prizes(event_id);
CREATE INDEX idx_event_prizes_position ON event_prizes(event_id, position);

-- =====================================================
-- EVENT FAQ TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS event_faq (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category VARCHAR(100), -- 'general', 'registration', 'venue', 'schedule', etc.
  display_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Index for faster queries
CREATE INDEX idx_event_faq_event_id ON event_faq(event_id);
CREATE INDEX idx_event_faq_category ON event_faq(event_id, category);
CREATE INDEX idx_event_faq_published ON event_faq(event_id, is_published);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE event_agenda ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_speakers ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_faq ENABLE ROW LEVEL SECURITY;

-- Public read access for published events
CREATE POLICY "Public can view agenda for published events"
  ON event_agenda FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_agenda.event_id
      AND events.status = 'published'
    )
  );

CREATE POLICY "Public can view speakers for published events"
  ON event_speakers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_speakers.event_id
      AND events.status = 'published'
    )
  );

CREATE POLICY "Public can view prizes for published events"
  ON event_prizes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_prizes.event_id
      AND events.status = 'published'
    )
  );

CREATE POLICY "Public can view published FAQs for published events"
  ON event_faq FOR SELECT
  USING (
    is_published = TRUE
    AND EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_faq.event_id
      AND events.status = 'published'
    )
  );

-- Event creators and collaborators can manage
CREATE POLICY "Event creators can manage agenda"
  ON event_agenda FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_agenda.event_id
      AND events.created_by = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM event_collaborators
      WHERE event_collaborators.event_id = event_agenda.event_id
      AND event_collaborators.user_id = auth.uid()
      AND event_collaborators.is_active = true
      AND event_collaborators.can_edit_details = true
    )
  );

CREATE POLICY "Event creators can manage speakers"
  ON event_speakers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_speakers.event_id
      AND events.created_by = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM event_collaborators
      WHERE event_collaborators.event_id = event_speakers.event_id
      AND event_collaborators.user_id = auth.uid()
      AND event_collaborators.is_active = true
      AND event_collaborators.can_edit_details = true
    )
  );

CREATE POLICY "Event creators can manage prizes"
  ON event_prizes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_prizes.event_id
      AND events.created_by = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM event_collaborators
      WHERE event_collaborators.event_id = event_prizes.event_id
      AND event_collaborators.user_id = auth.uid()
      AND event_collaborators.is_active = true
      AND event_collaborators.can_edit_details = true
    )
  );

CREATE POLICY "Event creators can manage FAQ"
  ON event_faq FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_faq.event_id
      AND events.created_by = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM event_collaborators
      WHERE event_collaborators.event_id = event_faq.event_id
      AND event_collaborators.user_id = auth.uid()
      AND event_collaborators.is_active = true
      AND event_collaborators.can_edit_details = true
    )
  );

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_event_agenda_updated_at
  BEFORE UPDATE ON event_agenda
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_speakers_updated_at
  BEFORE UPDATE ON event_speakers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_prizes_updated_at
  BEFORE UPDATE ON event_prizes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_faq_updated_at
  BEFORE UPDATE ON event_faq
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE event_agenda IS 'Event schedule and agenda items';
COMMENT ON TABLE event_speakers IS 'Event speakers and guests information';
COMMENT ON TABLE event_prizes IS 'Event prizes and rewards';
COMMENT ON TABLE event_faq IS 'Event frequently asked questions';
