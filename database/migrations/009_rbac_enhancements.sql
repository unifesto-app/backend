-- =========================
-- RBAC ENHANCEMENTS MIGRATION
-- =========================
-- This migration adds comprehensive RBAC features including:
-- - Organization hierarchy depth tracking
-- - Super admin tracking
-- - Event approval workflow
-- - Content removal system
-- - Enhanced permissions

-- =========================
-- ORGANIZATIONS TABLE ENHANCEMENTS
-- =========================

-- Add RBAC columns to organizations
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS super_admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS depth_level INTEGER DEFAULT 0;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_org_super_admin ON organizations(super_admin_id);
CREATE INDEX IF NOT EXISTS idx_org_depth ON organizations(depth_level);

-- Add comment explaining super_admin_id
COMMENT ON COLUMN organizations.super_admin_id IS 
'The Organization Super Admin (owner) who has full control over this org hierarchy';

-- =========================
-- ORGANIZATION MEMBERS TABLE ENHANCEMENTS
-- =========================

-- Add granular permission columns
ALTER TABLE organization_members
ADD COLUMN IF NOT EXISTS can_manage_sub_orgs BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS can_approve_events BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS can_view_analytics BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS can_export_reports BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS analytics_scope TEXT DEFAULT 'none' 
  CHECK (analytics_scope IN ('none', 'events', 'organization', 'hierarchy'));

-- Update permissions column comment
COMMENT ON COLUMN organization_members.permissions IS 
'JSONB structure for custom permissions: {
  "can_manage_members": boolean,
  "can_create_events": boolean,
  "can_manage_events": boolean,
  "event_scope": "all" | "own",
  "custom_permissions": {}
}';

-- Set default permissions based on role
UPDATE organization_members
SET 
  can_manage_sub_orgs = CASE WHEN role IN ('owner', 'admin') THEN TRUE ELSE FALSE END,
  can_approve_events = CASE WHEN role IN ('owner', 'admin') THEN TRUE ELSE FALSE END,
  can_view_analytics = CASE WHEN role IN ('owner', 'admin', 'organizer') THEN TRUE ELSE FALSE END,
  can_export_reports = CASE WHEN role IN ('owner', 'admin') THEN TRUE ELSE FALSE END,
  analytics_scope = CASE 
    WHEN role = 'owner' THEN 'hierarchy'
    WHEN role = 'admin' THEN 'organization'
    WHEN role = 'organizer' THEN 'events'
    ELSE 'none'
  END
WHERE can_manage_sub_orgs IS NULL;

-- =========================
-- EVENTS TABLE ENHANCEMENTS
-- =========================

-- Check if events table exists, if not create it
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add event approval workflow columns
ALTER TABLE events
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft' 
  CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'published', 'cancelled')),
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS submitted_for_approval_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS ownership_status TEXT DEFAULT 'active'
  CHECK (ownership_status IN ('active', 'transferred', 'anonymized', 'deleted'));

-- Create indexes for events
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_org_status ON events(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);
CREATE INDEX IF NOT EXISTS idx_events_pending ON events(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_events_org ON events(organization_id);

-- Add updated_at trigger for events
DROP TRIGGER IF EXISTS trg_events_updated ON events;
CREATE TRIGGER trg_events_updated
BEFORE UPDATE ON events
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =========================
-- EVENT APPROVAL HISTORY TABLE
-- =========================

CREATE TABLE IF NOT EXISTS event_approval_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('submitted', 'approved', 'rejected', 'revised')),
  performed_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_approval_history_event ON event_approval_history(event_id);
CREATE INDEX IF NOT EXISTS idx_approval_history_date ON event_approval_history(created_at DESC);

-- =========================
-- CONTENT REMOVAL REQUESTS TABLE
-- =========================

CREATE TABLE IF NOT EXISTS content_removal_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('event', 'post', 'comment')),
  content_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('transfer', 'delete', 'anonymize')),
  transfer_to_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  processed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_removal_user ON content_removal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_content_removal_org ON content_removal_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_content_removal_status ON content_removal_requests(status);

-- Add updated_at trigger
DROP TRIGGER IF EXISTS trg_content_removal_updated ON content_removal_requests;
CREATE TRIGGER trg_content_removal_updated
BEFORE UPDATE ON content_removal_requests
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =========================
-- RBAC FUNCTIONS
-- =========================

-- Function to calculate organization depth
CREATE OR REPLACE FUNCTION calculate_org_depth(p_org_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_depth INTEGER := 0;
  v_parent_id UUID;
  v_visited UUID[] := ARRAY[]::UUID[];
BEGIN
  v_parent_id := (SELECT parent_org_id FROM organizations WHERE id = p_org_id);
  
  WHILE v_parent_id IS NOT NULL LOOP
    -- Check for circular reference
    IF v_parent_id = ANY(v_visited) THEN
      RAISE EXCEPTION 'Circular reference detected in organization hierarchy';
    END IF;
    
    v_visited := array_append(v_visited, v_parent_id);
    v_depth := v_depth + 1;
    
    -- Safety check
    IF v_depth > 10 THEN
      RAISE EXCEPTION 'Organization hierarchy too deep (possible circular reference)';
    END IF;
    
    SELECT parent_org_id INTO v_parent_id
    FROM organizations
    WHERE id = v_parent_id;
  END LOOP;
  
  RETURN v_depth;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to validate organization depth limit
CREATE OR REPLACE FUNCTION validate_org_depth()
RETURNS TRIGGER AS $$
DECLARE
  v_depth INTEGER;
  v_max_depth INTEGER := 5;
BEGIN
  IF NEW.parent_org_id IS NOT NULL THEN
    -- Calculate depth for the new/updated organization
    v_depth := calculate_org_depth(NEW.id);
    
    IF v_depth >= v_max_depth THEN
      RAISE EXCEPTION 'Organization hierarchy depth limit (%) exceeded. Current depth would be: %. Please reduce hierarchy depth.', 
        v_max_depth, v_depth;
    END IF;
    
    NEW.depth_level := v_depth;
  ELSE
    NEW.depth_level := 0;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for depth validation
DROP TRIGGER IF EXISTS check_org_depth_limit ON organizations;
CREATE TRIGGER check_org_depth_limit
  BEFORE INSERT OR UPDATE OF parent_org_id ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION validate_org_depth();

-- Function to check hierarchy access
CREATE OR REPLACE FUNCTION user_has_hierarchy_access(
  p_user_id UUID,
  p_org_id UUID,
  p_required_role TEXT DEFAULT 'member'
)
RETURNS BOOLEAN AS $$
DECLARE
  v_has_access BOOLEAN := FALSE;
  v_user_platform_role TEXT;
BEGIN
  -- Check if Platform Super Admin
  SELECT role INTO v_user_platform_role
  FROM profiles
  WHERE id = p_user_id;
  
  IF v_user_platform_role = 'super_admin' THEN
    RETURN TRUE;
  END IF;
  
  -- Check if Org Super Admin of any parent in hierarchy
  WITH RECURSIVE org_path AS (
    SELECT id, parent_org_id, super_admin_id
    FROM organizations
    WHERE id = p_org_id
    
    UNION ALL
    
    SELECT o.id, o.parent_org_id, o.super_admin_id
    FROM organizations o
    JOIN org_path op ON o.id = op.parent_org_id
  )
  SELECT EXISTS (
    SELECT 1 FROM org_path
    WHERE super_admin_id = p_user_id
  ) INTO v_has_access;
  
  IF v_has_access THEN
    RETURN TRUE;
  END IF;
  
  -- Check direct membership with required role
  SELECT EXISTS (
    SELECT 1
    FROM organization_members
    WHERE user_id = p_user_id
    AND organization_id = p_org_id
    AND CASE p_required_role
      WHEN 'owner' THEN role = 'owner'
      WHEN 'admin' THEN role IN ('owner', 'admin')
      WHEN 'organizer' THEN role IN ('owner', 'admin', 'organizer')
      ELSE role IN ('owner', 'admin', 'organizer', 'member')
    END
  ) INTO v_has_access;
  
  RETURN v_has_access;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function to get user's accessible organizations
CREATE OR REPLACE FUNCTION get_user_accessible_orgs(
  p_user_id UUID,
  p_role_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
  org_id UUID,
  org_name TEXT,
  org_slug TEXT,
  org_type TEXT,
  user_role TEXT,
  access_type TEXT,
  can_manage BOOLEAN,
  depth_level INTEGER
) AS $$
BEGIN
  RETURN QUERY
  -- Direct memberships
  SELECT 
    o.id,
    o.name,
    o.slug,
    o.type,
    om.role,
    'direct'::TEXT,
    om.role IN ('owner', 'admin'),
    o.depth_level
  FROM organizations o
  JOIN organization_members om ON o.id = om.organization_id
  WHERE om.user_id = p_user_id
    AND (p_role_filter IS NULL OR om.role = p_role_filter)
    AND o.is_active = TRUE
  
  UNION
  
  -- Hierarchy access (Super Admin of parent)
  WITH RECURSIVE org_tree AS (
    SELECT o.id, o.name, o.slug, o.type, o.parent_org_id, o.depth_level, om.role
    FROM organizations o
    JOIN organization_members om ON o.id = om.organization_id
    WHERE om.user_id = p_user_id 
      AND om.role = 'owner'
      AND o.is_active = TRUE
    
    UNION ALL
    
    SELECT o.id, o.name, o.slug, o.type, o.parent_org_id, o.depth_level, ot.role
    FROM organizations o
    JOIN org_tree ot ON o.parent_org_id = ot.id
    WHERE o.is_active = TRUE
  )
  SELECT 
    id,
    name,
    slug,
    type,
    role,
    'hierarchy'::TEXT,
    TRUE,
    depth_level
  FROM org_tree
  WHERE id NOT IN (
    SELECT organization_id 
    FROM organization_members 
    WHERE user_id = p_user_id
  )
  
  ORDER BY depth_level, org_name;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function to get pending events for admin
CREATE OR REPLACE FUNCTION get_pending_events_for_admin(
  p_user_id UUID
)
RETURNS TABLE (
  event_id UUID,
  event_title TEXT,
  event_description TEXT,
  org_id UUID,
  org_name TEXT,
  created_by_id UUID,
  created_by_name TEXT,
  submitted_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.title,
    e.description,
    e.organization_id,
    o.name,
    e.created_by,
    p.name,
    e.submitted_for_approval_at
  FROM events e
  JOIN organizations o ON e.organization_id = o.id
  LEFT JOIN profiles p ON e.created_by = p.id
  WHERE e.status = 'pending'
    AND user_has_hierarchy_access(p_user_id, e.organization_id, 'admin')
  ORDER BY e.submitted_for_approval_at ASC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- =========================
-- ENHANCED RLS POLICIES
-- =========================

-- Drop old policies
DROP POLICY IF EXISTS "read active orgs" ON organizations;
DROP POLICY IF EXISTS "admin update org" ON organizations;

-- Platform admins can see and manage all orgs
CREATE POLICY "platform_admin_all_orgs" ON organizations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Users can see orgs they have access to
CREATE POLICY "user_accessible_orgs" ON organizations
  FOR SELECT
  USING (
    is_active = TRUE
    AND user_has_hierarchy_access(auth.uid(), id, 'member')
  );

-- Admins can update their orgs
CREATE POLICY "admin_update_orgs" ON organizations
  FOR UPDATE
  USING (
    user_has_hierarchy_access(auth.uid(), id, 'admin')
  );

-- Admins can create sub-orgs
CREATE POLICY "admin_create_suborgs" ON organizations
  FOR INSERT
  WITH CHECK (
    parent_org_id IS NULL -- Root orgs only by platform admin
    OR user_has_hierarchy_access(auth.uid(), parent_org_id, 'admin')
  );

-- Enable RLS on events
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Users can see events in their orgs
CREATE POLICY "user_org_events" ON events
  FOR SELECT
  USING (
    user_has_hierarchy_access(auth.uid(), organization_id, 'member')
    OR created_by = auth.uid()
  );

-- Organizers can create events
CREATE POLICY "organizer_create_events" ON events
  FOR INSERT
  WITH CHECK (
    user_has_hierarchy_access(auth.uid(), organization_id, 'organizer')
  );

-- Creators and admins can update events
CREATE POLICY "update_own_or_admin_events" ON events
  FOR UPDATE
  USING (
    created_by = auth.uid()
    OR user_has_hierarchy_access(auth.uid(), organization_id, 'admin')
  );

-- Creators and admins can delete events
CREATE POLICY "delete_own_or_admin_events" ON events
  FOR DELETE
  USING (
    created_by = auth.uid()
    OR user_has_hierarchy_access(auth.uid(), organization_id, 'admin')
  );

-- Enable RLS on event_approval_history
ALTER TABLE event_approval_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view_approval_history" ON event_approval_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_approval_history.event_id
      AND (
        e.created_by = auth.uid()
        OR user_has_hierarchy_access(auth.uid(), e.organization_id, 'admin')
      )
    )
  );

-- Enable RLS on content_removal_requests
ALTER TABLE content_removal_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view_own_removal_requests" ON content_removal_requests
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR user_has_hierarchy_access(auth.uid(), organization_id, 'admin')
  );

CREATE POLICY "create_own_removal_requests" ON content_removal_requests
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "admin_manage_removal_requests" ON content_removal_requests
  FOR UPDATE
  USING (
    user_has_hierarchy_access(auth.uid(), organization_id, 'admin')
  );

-- =========================
-- UPDATE EXISTING DATA
-- =========================

-- Set super_admin_id for existing organizations with owner
UPDATE organizations o
SET super_admin_id = (
  SELECT om.user_id
  FROM organization_members om
  WHERE om.organization_id = o.id
  AND om.role = 'owner'
  LIMIT 1
)
WHERE super_admin_id IS NULL
AND EXISTS (
  SELECT 1 FROM organization_members
  WHERE organization_id = o.id AND role = 'owner'
);

-- Calculate and set depth_level for existing organizations
UPDATE organizations
SET depth_level = calculate_org_depth(id)
WHERE depth_level = 0 AND parent_org_id IS NOT NULL;

-- =========================
-- COMMENTS
-- =========================

COMMENT ON TABLE event_approval_history IS 'Tracks all approval actions on events for audit trail';
COMMENT ON TABLE content_removal_requests IS 'Manages user consent for content removal when leaving organizations';
COMMENT ON FUNCTION user_has_hierarchy_access IS 'Checks if user has access to organization via direct membership or hierarchy';
COMMENT ON FUNCTION get_user_accessible_orgs IS 'Returns all organizations user can access with their role and access type';
COMMENT ON FUNCTION get_pending_events_for_admin IS 'Returns pending events that require admin approval';

-- =========================
-- MIGRATION COMPLETE
-- =========================

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE 'RBAC Enhancement Migration completed successfully';
  RAISE NOTICE 'Added: Organization depth tracking, event approval workflow, content removal system';
  RAISE NOTICE 'Enhanced: Permissions system, RLS policies, hierarchy access functions';
END $$;
