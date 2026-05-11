-- =========================
-- UNIFIED ROLES SYSTEM MIGRATION
-- =========================
-- This migration implements the unified role system:
-- - Platform roles (in profiles table): attendee, organizer, org_admin, org_super_admin, super_admin
-- - Organization relationships (in organization_members table): owner, admin, member
-- =========================

-- Step 0: Drop functions that depend on the 'role' column
DROP FUNCTION IF EXISTS user_has_org_permission(UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS user_has_hierarchy_access(UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS get_user_accessible_orgs(UUID, TEXT);
DROP FUNCTION IF EXISTS get_pending_events_for_admin(UUID);

-- Step 1: Update organization_members table
-- Rename 'role' column to 'relationship_type'
ALTER TABLE organization_members 
RENAME COLUMN role TO relationship_type;

-- Step 2: Update the check constraint to remove 'organizer' and use new values
ALTER TABLE organization_members 
DROP CONSTRAINT IF EXISTS organization_members_role_check;

ALTER TABLE organization_members 
ADD CONSTRAINT organization_members_relationship_type_check 
CHECK (relationship_type IN ('owner', 'admin', 'member'));

-- Step 3: Migrate existing 'organizer' relationships to 'member'
UPDATE organization_members 
SET relationship_type = 'member' 
WHERE relationship_type = 'organizer';

-- Step 4: Drop the permissions JSONB column (no longer needed)
ALTER TABLE organization_members 
DROP COLUMN IF EXISTS permissions;

-- Step 5: Update RLS policies to use relationship_type
DROP POLICY IF EXISTS "admin update org" ON organizations;
CREATE POLICY "admin update org"
ON organizations FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = organizations.id
    AND user_id = auth.uid()
    AND relationship_type IN ('owner','admin')
  )
);

DROP POLICY IF EXISTS "manage members" ON organization_members;
CREATE POLICY "manage members"
ON organization_members FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.organization_id = organization_members.organization_id
    AND om.user_id = auth.uid()
    AND om.relationship_type IN ('owner','admin')
  )
);

DROP POLICY IF EXISTS "manage invites" ON organization_invitations;
CREATE POLICY "manage invites"
ON organization_invitations FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = organization_invitations.organization_id
    AND user_id = auth.uid()
    AND relationship_type IN ('owner','admin')
  )
);

-- Step 6: Recreate the permission function to use relationship_type
CREATE FUNCTION user_has_org_permission(
  p_user_id UUID,
  p_org_id UUID,
  p_required_relationship TEXT DEFAULT 'member'
)
RETURNS BOOLEAN AS $$
DECLARE
  v_relationship TEXT;
  relationships TEXT[] := ARRAY['member','admin','owner'];
BEGIN
  SELECT relationship_type INTO v_relationship
  FROM organization_members
  WHERE organization_id = p_org_id
  AND user_id = p_user_id;

  IF v_relationship IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN array_position(relationships, v_relationship) >= array_position(relationships, p_required_relationship);
END;
$$ LANGUAGE plpgsql STABLE;

-- Step 7: Recreate hierarchy access function
CREATE FUNCTION user_has_hierarchy_access(
  p_user_id UUID,
  p_org_id UUID,
  p_required_relationship TEXT DEFAULT 'member'
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
  
  -- Check direct membership with required relationship
  SELECT EXISTS (
    SELECT 1
    FROM organization_members
    WHERE user_id = p_user_id
    AND organization_id = p_org_id
    AND CASE p_required_relationship
      WHEN 'owner' THEN relationship_type = 'owner'
      WHEN 'admin' THEN relationship_type IN ('owner', 'admin')
      ELSE relationship_type IN ('owner', 'admin', 'member')
    END
  ) INTO v_has_access;
  
  RETURN v_has_access;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Step 8: Recreate get_user_accessible_orgs function
CREATE FUNCTION get_user_accessible_orgs(
  p_user_id UUID,
  p_relationship_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
  org_id UUID,
  org_name TEXT,
  org_slug TEXT,
  org_type TEXT,
  user_relationship TEXT,
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
    om.relationship_type,
    'direct'::TEXT,
    om.relationship_type IN ('owner', 'admin'),
    o.depth_level
  FROM organizations o
  JOIN organization_members om ON o.id = om.organization_id
  WHERE om.user_id = p_user_id
    AND (p_relationship_filter IS NULL OR om.relationship_type = p_relationship_filter)
    AND o.is_active = TRUE
  
  UNION
  
  -- Hierarchy access (Super Admin of parent)
  SELECT 
    ot.id,
    ot.name,
    ot.slug,
    ot.type,
    ot.relationship_type,
    'hierarchy'::TEXT,
    TRUE,
    ot.depth_level
  FROM (
    WITH RECURSIVE org_tree AS (
      SELECT o.id, o.name, o.slug, o.type, o.parent_org_id, o.depth_level, om.relationship_type
      FROM organizations o
      JOIN organization_members om ON o.id = om.organization_id
      WHERE om.user_id = p_user_id 
        AND om.relationship_type = 'owner'
        AND o.is_active = TRUE
      
      UNION ALL
      
      SELECT o.id, o.name, o.slug, o.type, o.parent_org_id, o.depth_level, ot.relationship_type
      FROM organizations o
      JOIN org_tree ot ON o.parent_org_id = ot.id
      WHERE o.is_active = TRUE
    )
    SELECT * FROM org_tree
    WHERE id NOT IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = p_user_id
    )
  ) ot
  
  ORDER BY depth_level, org_name;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Step 9: Recreate get_pending_events_for_admin function
CREATE FUNCTION get_pending_events_for_admin(
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

-- Step 10: Update organization_invitations role check constraint
ALTER TABLE organization_invitations 
DROP CONSTRAINT IF EXISTS organization_invitations_role_check;

ALTER TABLE organization_invitations 
ADD CONSTRAINT organization_invitations_role_check 
CHECK (role IN ('admin', 'member'));

-- Migrate existing 'organizer' invitations to 'member'
UPDATE organization_invitations 
SET role = 'member' 
WHERE role = 'organizer';

-- =========================
-- VERIFICATION QUERIES
-- =========================
-- Run these to verify the migration:
-- SELECT relationship_type, COUNT(*) FROM organization_members GROUP BY relationship_type;
-- SELECT role, COUNT(*) FROM organization_invitations GROUP BY role;
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'organization_members';
