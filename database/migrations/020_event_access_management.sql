-- =====================================================
-- Migration 020: Event Access Management System
-- =====================================================
-- Description: Implements granular event-level permissions
-- allowing creators to share access with specific users
-- and manage tab-level permissions. Admins can request access.
-- =====================================================

-- =========================
-- EVENT COLLABORATORS TABLE
-- =========================

CREATE TABLE IF NOT EXISTS event_collaborators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  granted_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Tab-level permissions
  can_view_overview BOOLEAN DEFAULT true,
  can_edit_details BOOLEAN DEFAULT false,
  can_manage_attendees BOOLEAN DEFAULT false,
  can_manage_volunteers BOOLEAN DEFAULT false,
  can_manage_checkin BOOLEAN DEFAULT false,
  can_manage_tickets BOOLEAN DEFAULT false,
  can_manage_payments BOOLEAN DEFAULT false,
  can_manage_content BOOLEAN DEFAULT false,
  can_manage_campaigns BOOLEAN DEFAULT false,
  can_manage_discussion BOOLEAN DEFAULT false,
  can_view_analytics BOOLEAN DEFAULT false,
  can_manage_certificates BOOLEAN DEFAULT false,
  can_manage_settings BOOLEAN DEFAULT false,
  can_manage_access BOOLEAN DEFAULT false, -- Can grant/revoke access to others
  
  -- Metadata
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(event_id, user_id),
  CHECK (user_id != granted_by) -- Cannot grant access to self
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_event_collaborators_event ON event_collaborators(event_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_event_collaborators_user ON event_collaborators(user_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_event_collaborators_active ON event_collaborators(event_id, user_id) WHERE is_active = true;

-- Updated at trigger
DROP TRIGGER IF EXISTS trg_event_collaborators_updated ON event_collaborators;
CREATE TRIGGER trg_event_collaborators_updated
BEFORE UPDATE ON event_collaborators
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =========================
-- EVENT ACCESS REQUESTS TABLE
-- =========================

CREATE TABLE IF NOT EXISTS event_access_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Request details
  requested_permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  
  -- Processing
  processed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  processed_at TIMESTAMPTZ,
  response_message TEXT,
  
  -- Metadata
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(event_id, user_id, status) -- One pending request per user per event
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_event_access_requests_event ON event_access_requests(event_id);
CREATE INDEX IF NOT EXISTS idx_event_access_requests_user ON event_access_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_event_access_requests_status ON event_access_requests(status);
CREATE INDEX IF NOT EXISTS idx_event_access_requests_pending ON event_access_requests(event_id, status) WHERE status = 'pending';

-- Updated at trigger
DROP TRIGGER IF EXISTS trg_event_access_requests_updated ON event_access_requests;
CREATE TRIGGER trg_event_access_requests_updated
BEFORE UPDATE ON event_access_requests
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =========================
-- EVENT ACCESS AUDIT LOG
-- =========================

CREATE TABLE IF NOT EXISTS event_access_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN (
    'access_granted', 'access_revoked', 'access_modified',
    'access_requested', 'request_approved', 'request_rejected', 'request_cancelled'
  )),
  performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_event_access_audit_event ON event_access_audit_log(event_id);
CREATE INDEX IF NOT EXISTS idx_event_access_audit_user ON event_access_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_event_access_audit_date ON event_access_audit_log(created_at DESC);

-- =========================
-- HELPER FUNCTIONS
-- =========================

-- Function to check if user can manage event
CREATE OR REPLACE FUNCTION can_manage_event(
  p_user_id UUID,
  p_event_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_event RECORD;
  v_is_platform_admin BOOLEAN;
  v_has_collaborator_access BOOLEAN;
BEGIN
  -- Get event details
  SELECT * INTO v_event FROM events WHERE id = p_event_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Check if user is the creator
  IF v_event.created_by = p_user_id THEN
    RETURN true;
  END IF;
  
  -- Check if platform super admin
  SELECT (role = 'super_admin') INTO v_is_platform_admin
  FROM profiles
  WHERE id = p_user_id;
  
  IF v_is_platform_admin THEN
    RETURN false; -- Super admins need explicit permission
  END IF;
  
  -- Check if user has collaborator access with edit permissions
  SELECT EXISTS(
    SELECT 1 FROM event_collaborators
    WHERE event_id = p_event_id
    AND user_id = p_user_id
    AND is_active = true
    AND can_edit_details = true
  ) INTO v_has_collaborator_access;
  
  RETURN v_has_collaborator_access;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's event permissions
CREATE OR REPLACE FUNCTION get_user_event_permissions(
  p_user_id UUID,
  p_event_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_event RECORD;
  v_is_creator BOOLEAN;
  v_collaborator RECORD;
  v_permissions JSONB;
BEGIN
  -- Get event details
  SELECT * INTO v_event FROM events WHERE id = p_event_id;
  
  IF NOT FOUND THEN
    RETURN '{}'::jsonb;
  END IF;
  
  -- Check if user is the creator
  v_is_creator := (v_event.created_by = p_user_id);
  
  IF v_is_creator THEN
    -- Creator has all permissions
    RETURN jsonb_build_object(
      'is_creator', true,
      'can_view_overview', true,
      'can_edit_details', true,
      'can_manage_attendees', true,
      'can_manage_volunteers', true,
      'can_manage_checkin', true,
      'can_manage_tickets', true,
      'can_manage_payments', true,
      'can_manage_content', true,
      'can_manage_campaigns', true,
      'can_manage_discussion', true,
      'can_view_analytics', true,
      'can_manage_certificates', true,
      'can_manage_settings', true,
      'can_manage_access', true
    );
  END IF;
  
  -- Check collaborator permissions
  SELECT * INTO v_collaborator
  FROM event_collaborators
  WHERE event_id = p_event_id
  AND user_id = p_user_id
  AND is_active = true;
  
  IF FOUND THEN
    RETURN jsonb_build_object(
      'is_creator', false,
      'is_collaborator', true,
      'can_view_overview', v_collaborator.can_view_overview,
      'can_edit_details', v_collaborator.can_edit_details,
      'can_manage_attendees', v_collaborator.can_manage_attendees,
      'can_manage_volunteers', v_collaborator.can_manage_volunteers,
      'can_manage_checkin', v_collaborator.can_manage_checkin,
      'can_manage_tickets', v_collaborator.can_manage_tickets,
      'can_manage_payments', v_collaborator.can_manage_payments,
      'can_manage_content', v_collaborator.can_manage_content,
      'can_manage_campaigns', v_collaborator.can_manage_campaigns,
      'can_manage_discussion', v_collaborator.can_manage_discussion,
      'can_view_analytics', v_collaborator.can_view_analytics,
      'can_manage_certificates', v_collaborator.can_manage_certificates,
      'can_manage_settings', v_collaborator.can_manage_settings,
      'can_manage_access', v_collaborator.can_manage_access,
      'granted_by', v_collaborator.granted_by,
      'granted_at', v_collaborator.granted_at
    );
  END IF;
  
  -- No access
  RETURN jsonb_build_object(
    'is_creator', false,
    'is_collaborator', false,
    'has_access', false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================
-- ROW LEVEL SECURITY (RLS)
-- =========================

-- Enable RLS on new tables
ALTER TABLE event_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_access_audit_log ENABLE ROW LEVEL SECURITY;

-- Policies for event_collaborators
CREATE POLICY "Users can view their own collaborator records"
  ON event_collaborators FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Event creators can view all collaborators"
  ON event_collaborators FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_collaborators.event_id
      AND events.created_by = auth.uid()
    )
  );

CREATE POLICY "Event creators can manage collaborators"
  ON event_collaborators FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_collaborators.event_id
      AND events.created_by = auth.uid()
    )
  );

CREATE POLICY "Users with manage_access permission can manage collaborators"
  ON event_collaborators FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM event_collaborators ec
      WHERE ec.event_id = event_collaborators.event_id
      AND ec.user_id = auth.uid()
      AND ec.is_active = true
      AND ec.can_manage_access = true
    )
  );

-- Policies for event_access_requests
CREATE POLICY "Users can view their own access requests"
  ON event_access_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Event creators can view all access requests"
  ON event_access_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_access_requests.event_id
      AND events.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can create access requests"
  ON event_access_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can cancel their own requests"
  ON event_access_requests FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (status = 'cancelled');

CREATE POLICY "Event creators can process access requests"
  ON event_access_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_access_requests.event_id
      AND events.created_by = auth.uid()
    )
  );

-- Policies for audit log
CREATE POLICY "Users can view audit logs for their events"
  ON event_access_audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_access_audit_log.event_id
      AND events.created_by = auth.uid()
    )
    OR auth.uid() = user_id
  );

-- =========================
-- COMMENTS
-- =========================

COMMENT ON TABLE event_collaborators IS 'Stores event-level collaborators with granular tab permissions';
COMMENT ON TABLE event_access_requests IS 'Stores access requests from users (including admins) to manage events';
COMMENT ON TABLE event_access_audit_log IS 'Audit trail for all event access changes';
COMMENT ON FUNCTION can_manage_event IS 'Checks if user can manage an event (creator or has edit permissions)';
COMMENT ON FUNCTION get_user_event_permissions IS 'Returns all event permissions for a user as JSONB';
