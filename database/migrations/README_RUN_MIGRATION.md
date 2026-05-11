# Run Migration 011: Update Profile Roles

## Issue
The profiles table currently only allows these roles:
- `attendee`
- `super_admin`
- `support`

But the admin panel needs these roles:
- `attendee`
- `organizer`
- `admin`
- `super_admin`

## Solution
Run migration `011_update_profile_roles.sql` to update the role constraint.

## How to Run

### Option 1: Using Supabase Dashboard (RECOMMENDED)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `011_update_profile_roles.sql` OR use `QUICK_FIX_USER_ROLES.sql` from project root
4. Paste and execute

### Option 2: Using psql
```bash
psql -h <your-supabase-host> -U postgres -d postgres -f database/migrations/011_update_profile_roles.sql
```

### Option 3: Using Supabase CLI
```bash
supabase db push
```

## Verification
After running the migration, verify it worked:

```sql
-- Check the constraint
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'profiles'::regclass 
AND conname = 'profiles_role_check';

-- Should show: CHECK (role IN ('attendee', 'organizer', 'admin', 'super_admin', 'support'))
```

## Test Creating a User
After migration, test creating a user with 'organizer' or 'admin' role in the admin panel.
