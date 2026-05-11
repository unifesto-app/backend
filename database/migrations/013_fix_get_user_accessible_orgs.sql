-- =========================
-- FIX: get_user_accessible_orgs Function
-- =========================
-- Fixes the ORDER BY clause placement in UNION query
-- =========================

DROP FUNCTION IF EXISTS get_user_accessible_orgs(UUID, TEXT);

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

-- Verify the function
SELECT proname, proargnames 
FROM pg_proc 
WHERE proname = 'get_user_accessible_orgs';
