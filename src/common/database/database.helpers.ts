/**
 * Database Helper Functions
 * 
 * Utility functions for common database operations
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../../types/database.types';

/**
 * Get user's organization hierarchy
 * Returns all organizations the user has access to, including parent organizations
 */
export async function getUserOrganizationHierarchy(
  supabase: SupabaseClient<Database>,
  userId: string,
) {
  const { data, error } = await supabase.rpc('get_user_org_hierarchy', {
    user_id_param: userId,
  });

  if (error) {
    throw new Error(`Failed to get user organization hierarchy: ${error.message}`);
  }

  return data;
}

/**
 * Check if user has permission for an organization
 */
export async function checkOrganizationPermission(
  supabase: SupabaseClient<Database>,
  userId: string,
  organizationId: string,
  permission: 'can_manage_sub_orgs' | 'can_approve_events' | 'can_view_analytics' | 'can_export_reports',
): Promise<boolean> {
  const { data, error } = await supabase
    .from('organization_members')
    .select(permission)
    .eq('user_id', userId)
    .eq('organization_id', organizationId)
    .eq('status', 'active')
    .is('deleted_at', null)
    .single();

  if (error || !data) {
    return false;
  }

  return data[permission] === true;
}

/**
 * Check if user is event collaborator
 */
export async function checkEventCollaborator(
  supabase: SupabaseClient<Database>,
  userId: string,
  eventId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from('event_collaborators')
    .select('id')
    .eq('user_id', userId)
    .eq('event_id', eventId)
    .eq('status', 'active')
    .is('deleted_at', null)
    .single();

  return !error && !!data;
}

/**
 * Get organization with hierarchy path
 */
export async function getOrganizationWithHierarchy(
  supabase: SupabaseClient<Database>,
  organizationId: string,
) {
  const { data, error } = await supabase
    .from('organizations')
    .select(`
      *,
      super_admin:profiles!organizations_super_admin_id_fkey(id, name, email, avatar_url),
      parent_org:organizations!organizations_parent_org_id_fkey(id, name, type, slug)
    `)
    .eq('id', organizationId)
    .is('deleted_at', null)
    .single();

  if (error) {
    throw new Error(`Failed to get organization: ${error.message}`);
  }

  return data;
}

/**
 * Get event with full details
 */
export async function getEventWithDetails(
  supabase: SupabaseClient<Database>,
  eventId: string,
) {
  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      organization:organizations!events_organization_id_fkey(id, name, slug, logo_url),
      creator:profiles!events_created_by_fkey(id, name, avatar_url)
    `)
    .eq('id', eventId)
    .is('deleted_at', null)
    .single();

  if (error) {
    throw new Error(`Failed to get event: ${error.message}`);
  }

  return data;
}

/**
 * Get user's wallet balance
 */
export async function getUserWalletBalance(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<number> {
  const { data, error } = await supabase
    .from('wallets')
    .select('balance')
    .eq('user_id', userId)
    .single();

  if (error) {
    throw new Error(`Failed to get wallet balance: ${error.message}`);
  }

  return data.balance ?? 0;
}

/**
 * Get recent transactions for user
 */
export async function getRecentTransactions(
  supabase: SupabaseClient<Database>,
  userId: string,
  limit: number = 10,
) {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to get transactions: ${error.message}`);
  }

  return data;
}

/**
 * Check if user can access event
 */
export async function canUserAccessEvent(
  supabase: SupabaseClient<Database>,
  userId: string,
  eventId: string,
): Promise<boolean> {
  // Get event
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('organization_id, created_by, status, is_private')
    .eq('id', eventId)
    .is('deleted_at', null)
    .single();

  if (eventError || !event) {
    return false;
  }

  // Public published events are accessible to all
  if (event.status === 'published' && !event.is_private) {
    return true;
  }

  // Check if user is creator
  if (event.created_by === userId) {
    return true;
  }

  // Check if user is organization member
  const { data: member } = await supabase
    .from('organization_members')
    .select('id')
    .eq('user_id', userId)
    .eq('organization_id', event.organization_id)
    .eq('status', 'active')
    .is('deleted_at', null)
    .single();

  if (member) {
    return true;
  }

  // Check if user is collaborator
  const { data: collaborator } = await supabase
    .from('event_collaborators')
    .select('id')
    .eq('user_id', userId)
    .eq('event_id', eventId)
    .eq('status', 'active')
    .is('deleted_at', null)
    .single();

  return !!collaborator;
}

/**
 * Soft delete helper
 */
export async function softDelete<T extends keyof Database['public']['Tables']>(
  supabase: SupabaseClient<Database>,
  table: T,
  id: string,
) {
  const { error } = await supabase
    .from(table)
    .update({ deleted_at: new Date().toISOString() } as any)
    .eq('id' as any, id);

  if (error) {
    throw new Error(`Failed to soft delete ${table}: ${error.message}`);
  }
}

/**
 * Restore soft deleted record
 */
export async function restoreSoftDeleted<T extends keyof Database['public']['Tables']>(
  supabase: SupabaseClient<Database>,
  table: T,
  id: string,
) {
  const { error } = await supabase
    .from(table)
    .update({ deleted_at: null } as any)
    .eq('id' as any, id);

  if (error) {
    throw new Error(`Failed to restore ${table}: ${error.message}`);
  }
}

/**
 * Get paginated results
 */
export async function getPaginatedResults<T extends keyof Database['public']['Tables']>(
  supabase: SupabaseClient<Database>,
  table: T,
  page: number = 1,
  limit: number = 20,
  filters?: Record<string, any>,
  orderBy?: { column: string; ascending?: boolean },
): Promise<{ data: any[]; total: number; page: number; limit: number; totalPages: number }> {
  let query = supabase
    .from(table)
    .select('*', { count: 'exact' })
    .is('deleted_at', null);

  // Apply filters
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query = query.eq(key as any, value);
      }
    });
  }

  // Apply ordering
  if (orderBy) {
    query = query.order(orderBy.column as any, { ascending: orderBy.ascending ?? false });
  }

  // Apply pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to get paginated results: ${error.message}`);
  }

  return {
    data: data || [],
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  };
}

/**
 * Check if record exists
 */
export async function recordExists<T extends keyof Database['public']['Tables']>(
  supabase: SupabaseClient<Database>,
  table: T,
  id: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from(table)
    .select('id')
    .eq('id' as any, id)
    .is('deleted_at', null)
    .single();

  return !error && !!data;
}

/**
 * Batch insert with error handling
 */
export async function batchInsert<T extends keyof Database['public']['Tables']>(
  supabase: SupabaseClient<Database>,
  table: T,
  records: any[],
  batchSize: number = 100,
) {
  const results: any[] = [];
  const errors: { batch: number; error: string }[] = [];

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    const { data, error } = await supabase
      .from(table)
      .insert(batch)
      .select();

    if (error) {
      errors.push({ batch: i / batchSize + 1, error: error.message });
    } else {
      results.push(...(data || []));
    }
  }

  return {
    inserted: results.length,
    failed: errors.length,
    errors,
    data: results,
  };
}
