-- =====================================================
-- Migration 021: Event Ticketing System
-- =====================================================
-- Description: Comprehensive ticketing system with support for
-- individual and group tickets, custom fields, and registrations
-- =====================================================

-- =========================
-- TICKETS TABLE
-- =========================

CREATE TABLE IF NOT EXISTS event_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  
  -- Basic Info
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'individual' CHECK (type IN ('individual', 'group')),
  
  -- Pricing
  price_type TEXT NOT NULL DEFAULT 'per_person' CHECK (price_type IN ('per_person', 'per_group')),
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'INR',
  
  -- Group Ticket Specific
  group_size INTEGER, -- Required for group tickets
  allow_partial_group BOOLEAN DEFAULT false,
  require_all_member_details BOOLEAN DEFAULT true,
  group_leader_required BOOLEAN DEFAULT true,
  
  -- Availability
  quantity_available INTEGER NOT NULL,
  quantity_sold INTEGER DEFAULT 0,
  min_purchase INTEGER DEFAULT 1,
  max_purchase INTEGER DEFAULT 10,
  
  -- Sales Period
  sales_start TIMESTAMPTZ,
  sales_end TIMESTAMPTZ,
  
  -- Visibility
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'draft')),
  
  -- Features
  is_early_bird BOOLEAN DEFAULT false,
  promo_code_applicable BOOLEAN DEFAULT true,
  is_refundable BOOLEAN DEFAULT false,
  seat_selection_enabled BOOLEAN DEFAULT false,
  tax_included BOOLEAN DEFAULT true,
  qr_enabled BOOLEAN DEFAULT true,
  
  -- Metadata
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CHECK (
    (type = 'individual' AND group_size IS NULL) OR
    (type = 'group' AND group_size > 1)
  ),
  CHECK (quantity_sold <= quantity_available),
  CHECK (min_purchase <= max_purchase),
  CHECK (price >= 0)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_event_tickets_event ON event_tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_event_tickets_visibility ON event_tickets(event_id, visibility);
CREATE INDEX IF NOT EXISTS idx_event_tickets_sales_start ON event_tickets(event_id, sales_start);
CREATE INDEX IF NOT EXISTS idx_event_tickets_sales_end ON event_tickets(event_id, sales_end);

-- Updated at trigger
DROP TRIGGER IF EXISTS trg_event_tickets_updated ON event_tickets;
CREATE TRIGGER trg_event_tickets_updated
BEFORE UPDATE ON event_tickets
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =========================
-- CUSTOM FIELDS TABLE
-- =========================

CREATE TABLE IF NOT EXISTS ticket_custom_fields (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  
  -- Field Configuration
  label TEXT NOT NULL,
  field_type TEXT NOT NULL CHECK (field_type IN (
    'text', 'textarea', 'email', 'phone', 'number', 
    'dropdown', 'multi_select', 'radio', 'date', 
    'file', 'checkbox', 'url', 'country', 'id_proof_type', 'id_proof_upload'
  )),
  placeholder TEXT,
  help_text TEXT,
  default_value TEXT,
  
  -- Validation
  is_required BOOLEAN DEFAULT false,
  validation_rules JSONB DEFAULT '{}'::jsonb,
  options_json JSONB, -- For dropdown, multi_select, radio
  
  -- Applicability
  applies_to_ticket_ids UUID[], -- NULL means applies to all tickets
  
  -- Display
  display_order INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ticket_custom_fields_event ON ticket_custom_fields(event_id);
CREATE INDEX IF NOT EXISTS idx_ticket_custom_fields_order ON ticket_custom_fields(event_id, display_order);

-- Updated at trigger
DROP TRIGGER IF EXISTS trg_ticket_custom_fields_updated ON ticket_custom_fields;
CREATE TRIGGER trg_ticket_custom_fields_updated
BEFORE UPDATE ON ticket_custom_fields
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =========================
-- REGISTRATIONS TABLE
-- =========================

CREATE TABLE IF NOT EXISTS event_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  ticket_id UUID NOT NULL REFERENCES event_tickets(id) ON DELETE RESTRICT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Group Registration
  group_id UUID, -- Links multiple registrations in same group purchase
  is_group_leader BOOLEAN DEFAULT false,
  
  -- Buyer Info (captured at registration)
  buyer_name TEXT NOT NULL,
  buyer_email TEXT NOT NULL,
  buyer_phone TEXT,
  
  -- Payment
  total_amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_id TEXT,
  payment_method TEXT,
  paid_at TIMESTAMPTZ,
  
  -- Registration Status
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'waitlisted', 'checked_in')),
  checked_in_at TIMESTAMPTZ,
  checked_in_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- QR Code
  qr_code TEXT UNIQUE,
  
  -- Metadata
  registration_number TEXT UNIQUE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_event_registrations_event ON event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_ticket ON event_registrations(ticket_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_user ON event_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_group ON event_registrations(group_id) WHERE group_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_event_registrations_qr ON event_registrations(qr_code);
CREATE INDEX IF NOT EXISTS idx_event_registrations_number ON event_registrations(registration_number);
CREATE INDEX IF NOT EXISTS idx_event_registrations_status ON event_registrations(event_id, status);

-- Updated at trigger
DROP TRIGGER IF EXISTS trg_event_registrations_updated ON event_registrations;
CREATE TRIGGER trg_event_registrations_updated
BEFORE UPDATE ON event_registrations
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =========================
-- REGISTRATION ANSWERS TABLE
-- =========================

CREATE TABLE IF NOT EXISTS registration_field_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  registration_id UUID NOT NULL REFERENCES event_registrations(id) ON DELETE CASCADE,
  field_id UUID NOT NULL REFERENCES ticket_custom_fields(id) ON DELETE CASCADE,
  
  -- Answer
  value TEXT,
  file_url TEXT, -- For file uploads
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(registration_id, field_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_registration_answers_registration ON registration_field_answers(registration_id);
CREATE INDEX IF NOT EXISTS idx_registration_answers_field ON registration_field_answers(field_id);

-- Updated at trigger
DROP TRIGGER IF EXISTS trg_registration_answers_updated ON registration_field_answers;
CREATE TRIGGER trg_registration_answers_updated
BEFORE UPDATE ON registration_field_answers
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =========================
-- RLS POLICIES
-- =========================

-- Event Tickets: Public read for published events, write for creators/collaborators
ALTER TABLE event_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view public tickets for published events"
ON event_tickets FOR SELECT
USING (
  visibility = 'public' AND
  EXISTS (
    SELECT 1 FROM events e
    WHERE e.id = event_tickets.event_id
    AND e.status = 'published'
  )
);

CREATE POLICY "Event creators can manage tickets"
ON event_tickets FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM events e
    WHERE e.id = event_tickets.event_id
    AND e.created_by = auth.uid()
  )
);

CREATE POLICY "Event collaborators with ticket permission can manage"
ON event_tickets FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM event_collaborators ec
    WHERE ec.event_id = event_tickets.event_id
    AND ec.user_id = auth.uid()
    AND ec.can_manage_tickets = true
    AND ec.is_active = true
  )
);

-- Custom Fields: Same as tickets
ALTER TABLE ticket_custom_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view custom fields for published events"
ON ticket_custom_fields FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM events e
    WHERE e.id = ticket_custom_fields.event_id
    AND e.status = 'published'
  )
);

CREATE POLICY "Event creators can manage custom fields"
ON ticket_custom_fields FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM events e
    WHERE e.id = ticket_custom_fields.event_id
    AND e.created_by = auth.uid()
  )
);

CREATE POLICY "Event collaborators with ticket permission can manage custom fields"
ON ticket_custom_fields FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM event_collaborators ec
    WHERE ec.event_id = ticket_custom_fields.event_id
    AND ec.user_id = auth.uid()
    AND ec.can_manage_tickets = true
    AND ec.is_active = true
  )
);

-- Registrations: Users can view their own, organizers can view all
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own registrations"
ON event_registrations FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Event creators can view all registrations"
ON event_registrations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM events e
    WHERE e.id = event_registrations.event_id
    AND e.created_by = auth.uid()
  )
);

CREATE POLICY "Event collaborators with attendee permission can view registrations"
ON event_registrations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM event_collaborators ec
    WHERE ec.event_id = event_registrations.event_id
    AND ec.user_id = auth.uid()
    AND ec.can_manage_attendees = true
    AND ec.is_active = true
  )
);

CREATE POLICY "Authenticated users can create registrations"
ON event_registrations FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own registrations"
ON event_registrations FOR UPDATE
USING (user_id = auth.uid());

-- Registration Answers: Follow registration policies
ALTER TABLE registration_field_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own registration answers"
ON registration_field_answers FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM event_registrations er
    WHERE er.id = registration_field_answers.registration_id
    AND er.user_id = auth.uid()
  )
);

CREATE POLICY "Event organizers can view all registration answers"
ON registration_field_answers FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM event_registrations er
    JOIN events e ON e.id = er.event_id
    WHERE er.id = registration_field_answers.registration_id
    AND e.created_by = auth.uid()
  )
);

CREATE POLICY "Users can create answers for their registrations"
ON registration_field_answers FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM event_registrations er
    WHERE er.id = registration_field_answers.registration_id
    AND er.user_id = auth.uid()
  )
);

-- =========================
-- FUNCTIONS
-- =========================

-- Function to generate unique registration number
CREATE OR REPLACE FUNCTION generate_registration_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.registration_number := 'REG-' || 
    TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
    UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate registration number
DROP TRIGGER IF EXISTS trg_generate_registration_number ON event_registrations;
CREATE TRIGGER trg_generate_registration_number
BEFORE INSERT ON event_registrations
FOR EACH ROW
WHEN (NEW.registration_number IS NULL)
EXECUTE FUNCTION generate_registration_number();

-- Function to update ticket sold count
CREATE OR REPLACE FUNCTION update_ticket_sold_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE event_tickets
    SET quantity_sold = quantity_sold + 1
    WHERE id = NEW.ticket_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE event_tickets
    SET quantity_sold = GREATEST(0, quantity_sold - 1)
    WHERE id = OLD.ticket_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'confirmed' AND NEW.status = 'cancelled' THEN
    UPDATE event_tickets
    SET quantity_sold = GREATEST(0, quantity_sold - 1)
    WHERE id = NEW.ticket_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'cancelled' AND NEW.status = 'confirmed' THEN
    UPDATE event_tickets
    SET quantity_sold = quantity_sold + 1
    WHERE id = NEW.ticket_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to maintain sold count
DROP TRIGGER IF EXISTS trg_update_ticket_sold_count ON event_registrations;
CREATE TRIGGER trg_update_ticket_sold_count
AFTER INSERT OR UPDATE OR DELETE ON event_registrations
FOR EACH ROW
EXECUTE FUNCTION update_ticket_sold_count();

-- =========================
-- COMMENTS
-- =========================

COMMENT ON TABLE event_tickets IS 'Event ticket types with support for individual and group tickets';
COMMENT ON TABLE ticket_custom_fields IS 'Custom registration form fields that can be attached to specific ticket types';
COMMENT ON TABLE event_registrations IS 'Event registrations/purchases with payment tracking';
COMMENT ON TABLE registration_field_answers IS 'User answers to custom registration fields';

COMMENT ON COLUMN event_tickets.type IS 'individual: one ticket = one attendee, group: one purchase = multiple attendees';
COMMENT ON COLUMN event_tickets.price_type IS 'per_person: price × group_size, per_group: fixed price for entire group';
COMMENT ON COLUMN event_tickets.group_size IS 'Number of people included in group ticket (required for type=group)';
COMMENT ON COLUMN ticket_custom_fields.applies_to_ticket_ids IS 'NULL means field applies to all tickets, otherwise specific ticket IDs';
COMMENT ON COLUMN event_registrations.group_id IS 'Links multiple registrations purchased together as a group';
