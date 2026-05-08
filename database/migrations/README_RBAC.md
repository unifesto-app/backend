# RBAC Enhancement Migration

## Overview
This migration (`009_rbac_enhancements.sql`) implements the comprehensive Role-Based Access Control system for Unifesto organizations.

## What's Included

### 1. Database Schema Changes

#### Organizations Table
- `super_admin_id` - Tracks the Organization Super Admin (owner)
- `depth_level` - Tracks hierarchy depth (max 5 levels)

#### Organization Members Table
- `can_manage_sub_orgs` - Permission to manage sub-organizations
- `can_approve_events` - Permission to approve events
- `can_view_analytics` - Permission to view analytics
- `can_export_reports` - Permission to export reports
- `analytics_scope` - Scope of analytics access (none/events/organization/hierarchy)

#### Events Table (Enhanced)
- `status` - Event status (draft/pending/approved/rejected/published/cancelled)
- `created_by` - Event creator
- `submitted_for_approval_at` - When submitted for approval
- `approved_by` - Who approved the event
- `approved_at` - When approved
- `rejected_at` - When rejected
- `rejection_reason` - Reason for rejection
- `ownership_status` - Content ownership status

#### New Tables
- `event_approval_history` - Tracks all approval actions
- `content_removal_requests` - Manages content removal with user consent

### 2. Database Functions

- `calculate_org_depth(org_id)` - Calculates organization depth in hierarchy
- `validate_org_depth()` - Trigger function to enforce 5-level limit
- `user_has_hierarchy_access(user_id, org_id, role)` - Checks hierarchy access
- `get_user_accessible_orgs(user_id, role_filter)` - Gets all accessible orgs
- `get_pending_events_for_admin(user_id)` - Gets pending events for approval

### 3. RLS Policies

Enhanced Row Level Security policies for:
- Organizations (platform admin, hierarchy access, admin updates)
- Events (view, create, update, delete based on role)
- Event approval history (view based on access)
- Content removal requests (view own, admin manage)

## Running the Migration

### Option 1: Using the Script (Recommended)

```bash
cd backend/database/scripts
./run-rbac-migration.sh
```

The script will:
1. Check for environment variables
2. Show migration details
3. Ask for confirmation
4. Run the migration
5. Show success/failure message

### Option 2: Manual Execution

```bash
# Using psql
psql $DATABASE_URL -f backend/database/migrations/009_rbac_enhancements.sql

# Or using Supabase CLI
supabase db push
```

### Option 3: Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the contents of `009_rbac_enhancements.sql`
4. Paste and run

## Prerequisites

- PostgreSQL 12+ or Supabase project
- Existing `008_create_organizations_system.sql` migration applied
- `profiles` table with `role` column
- `auth.users` table (Supabase auth)

## Environment Variables

Required in `.env`:

```env
DATABASE_URL=postgresql://user:password@host:port/database
# OR
SUPABASE_DB_URL=postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres
```

## Verification

After running the migration, verify with these queries:

```sql
-- Check new columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'organizations' 
AND column_name IN ('super_admin_id', 'depth_level');

-- Check new tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('event_approval_history', 'content_removal_requests');

-- Check functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name IN (
  'calculate_org_depth',
  'user_has_hierarchy_access',
  'get_user_accessible_orgs',
  'get_pending_events_for_admin'
);

-- Test hierarchy access function
SELECT user_has_hierarchy_access(
  'user-uuid'::uuid,
  'org-uuid'::uuid,
  'admin'
);
```

## Rollback

If you need to rollback this migration:

```sql
-- Drop new tables
DROP TABLE IF EXISTS content_removal_requests CASCADE;
DROP TABLE IF EXISTS event_approval_history CASCADE;

-- Drop new functions
DROP FUNCTION IF EXISTS get_pending_events_for_admin(UUID);
DROP FUNCTION IF EXISTS get_user_accessible_orgs(UUID, TEXT);
DROP FUNCTION IF EXISTS user_has_hierarchy_access(UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS validate_org_depth();
DROP FUNCTION IF EXISTS calculate_org_depth(UUID);

-- Remove new columns from events
ALTER TABLE events
DROP COLUMN IF EXISTS ownership_status,
DROP COLUMN IF EXISTS rejection_reason,
DROP COLUMN IF EXISTS rejected_at,
DROP COLUMN IF EXISTS approved_at,
DROP COLUMN IF EXISTS approved_by,
DROP COLUMN IF EXISTS submitted_for_approval_at,
DROP COLUMN IF EXISTS created_by,
DROP COLUMN IF EXISTS status;

-- Remove new columns from organization_members
ALTER TABLE organization_members
DROP COLUMN IF EXISTS analytics_scope,
DROP COLUMN IF EXISTS can_export_reports,
DROP COLUMN IF EXISTS can_view_analytics,
DROP COLUMN IF EXISTS can_approve_events,
DROP COLUMN IF EXISTS can_manage_sub_orgs;

-- Remove new columns from organizations
ALTER TABLE organizations
DROP COLUMN IF EXISTS depth_level,
DROP COLUMN IF EXISTS super_admin_id;

-- Restore old RLS policies
-- (You'll need to manually restore the old policies from 008_create_organizations_system.sql)
```

## Impact

### Breaking Changes
- None - This is an additive migration

### Performance Impact
- Minimal - New indexes added for performance
- Hierarchy access checks are optimized with STABLE functions

### Data Migration
- Existing organizations get `depth_level` calculated
- Existing members get default permissions based on role
- Existing organizations with owners get `super_admin_id` set

## Troubleshooting

### Error: "relation does not exist"
- Ensure `008_create_organizations_system.sql` was run first
- Check that `profiles` table exists

### Error: "column already exists"
- Migration is idempotent - safe to run multiple times
- Uses `IF NOT EXISTS` clauses

### Error: "circular reference detected"
- Check your organization hierarchy for loops
- Run: `SELECT id, name, parent_org_id FROM organizations WHERE parent_org_id IS NOT NULL;`

### Error: "depth limit exceeded"
- You have organizations deeper than 5 levels
- Restructure hierarchy or increase limit in migration

## Next Steps

After migration:

1. **Update Backend APIs** - Implement permission checks using new functions
2. **Update Admin Panel** - Add RBAC UI components
3. **Update Organiser Panel** - Add event approval workflow
4. **Test Permissions** - Verify all role scenarios work correctly
5. **Update Documentation** - Document new API endpoints and permissions

## Support

For issues or questions:
1. Check the main RBAC spec: `/.kiro/specs/organization-rbac/`
2. Review the design document: `design.md`
3. Check the requirements: `requirements.md`

## Migration History

- `008_create_organizations_system.sql` - Base organization system
- `009_rbac_enhancements.sql` - **This migration** - RBAC enhancements
