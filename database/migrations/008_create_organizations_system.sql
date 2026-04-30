-- =========================
-- EXTENSIONS
-- =========================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================
-- TABLES
-- =========================

CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('university', 'college', 'club', 'community')),
  description TEXT,
  parent_org_id UUID,
  logo_url TEXT,
  banner_url TEXT,
  website TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'India',
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 🔥 Ensure column exists even if table was created earlier
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS parent_org_id UUID;

-- Add FK safely
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'organizations_parent_org_id_fkey'
  ) THEN
    ALTER TABLE organizations
    ADD CONSTRAINT organizations_parent_org_id_fkey
    FOREIGN KEY (parent_org_id)
    REFERENCES organizations(id)
    ON DELETE CASCADE;
  END IF;
END $$;

-- MEMBERS
CREATE TABLE IF NOT EXISTS organization_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'organizer', 'member')),
  permissions JSONB DEFAULT '{}',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- INVITATIONS
CREATE TABLE IF NOT EXISTS organization_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'organizer', 'member')),
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================
-- INDEXES
-- =========================

CREATE INDEX IF NOT EXISTS idx_org_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_org_parent ON organizations(parent_org_id);
CREATE INDEX IF NOT EXISTS idx_org_active ON organizations(is_active);

CREATE INDEX IF NOT EXISTS idx_member_org ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_member_user ON organization_members(user_id);

CREATE INDEX IF NOT EXISTS idx_invite_org ON organization_invitations(organization_id);

-- =========================
-- RLS
-- =========================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_invitations ENABLE ROW LEVEL SECURITY;

-- ORGS
DROP POLICY IF EXISTS "read active orgs" ON organizations;
CREATE POLICY "read active orgs"
ON organizations FOR SELECT
USING (is_active = TRUE);

DROP POLICY IF EXISTS "admin update org" ON organizations;
CREATE POLICY "admin update org"
ON organizations FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = organizations.id
    AND user_id = auth.uid()
    AND role IN ('owner','admin')
  )
);

-- MEMBERS
DROP POLICY IF EXISTS "view members" ON organization_members;
CREATE POLICY "view members"
ON organization_members FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()
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
    AND om.role IN ('owner','admin')
  )
);

-- INVITES
DROP POLICY IF EXISTS "manage invites" ON organization_invitations;
CREATE POLICY "manage invites"
ON organization_invitations FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = organization_invitations.organization_id
    AND user_id = auth.uid()
    AND role IN ('owner','admin')
  )
);

-- =========================
-- FUNCTIONS
-- =========================

-- updated_at trigger
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_org_updated ON organizations;
CREATE TRIGGER trg_org_updated
BEFORE UPDATE ON organizations
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_member_updated ON organization_members;
CREATE TRIGGER trg_member_updated
BEFORE UPDATE ON organization_members
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_invite_updated ON organization_invitations;
CREATE TRIGGER trg_invite_updated
BEFORE UPDATE ON organization_invitations
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =========================
-- RECURSIVE FUNCTIONS (FIXED)
-- =========================

DROP FUNCTION IF EXISTS get_organization_hierarchy(UUID);

CREATE FUNCTION get_organization_hierarchy(org_id UUID)
RETURNS TABLE (id UUID, name TEXT, type TEXT, level INT) AS $$
WITH RECURSIVE org_tree(id, name, type, level, parent_org_id) AS (
  SELECT id, name, type, 0, parent_org_id
  FROM organizations
  WHERE id = org_id

  UNION ALL

  SELECT o.id, o.name, o.type, ot.level + 1, o.parent_org_id
  FROM organizations o
  JOIN org_tree ot ON o.parent_org_id = ot.id
)
SELECT id, name, type, level FROM org_tree;
$$ LANGUAGE sql STABLE;

DROP FUNCTION IF EXISTS get_organization_path(UUID);

CREATE FUNCTION get_organization_path(org_id UUID)
RETURNS TABLE (id UUID, name TEXT, type TEXT, level INT) AS $$
WITH RECURSIVE org_path(id, name, type, level, parent_org_id) AS (
  SELECT id, name, type, 0, parent_org_id
  FROM organizations
  WHERE id = org_id

  UNION ALL

  SELECT o.id, o.name, o.type, op.level + 1, o.parent_org_id
  FROM organizations o
  JOIN org_path op ON o.id = op.parent_org_id
)
SELECT id, name, type, level
FROM org_path
ORDER BY level DESC;
$$ LANGUAGE sql STABLE;

-- =========================
-- PERMISSION FUNCTION
-- =========================

DROP FUNCTION IF EXISTS user_has_org_permission(UUID, UUID, TEXT);

CREATE FUNCTION user_has_org_permission(
  p_user_id UUID,
  p_org_id UUID,
  p_required_role TEXT DEFAULT 'member'
)
RETURNS BOOLEAN AS $$
DECLARE
  v_role TEXT;
  roles TEXT[] := ARRAY['member','organizer','admin','owner'];
BEGIN
  SELECT role INTO v_role
  FROM organization_members
  WHERE organization_id = p_org_id
  AND user_id = p_user_id;

  IF v_role IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN array_position(roles, v_role) >= array_position(roles, p_required_role);
END;
$$ LANGUAGE plpgsql STABLE;