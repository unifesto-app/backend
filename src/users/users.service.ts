import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { UserQueryDto } from './dto/user-query.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { BulkOperationDto } from './dto/bulk-operation.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  private supabase;
  private adminClient;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey || !serviceRoleKey) {
      throw new Error('Missing Supabase configuration');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  /**
   * Check if user has admin role
   */
  private async checkAdminRole(userId: string): Promise<boolean> {
    const { data: profile } = await this.adminClient
      .from('profiles_with_roles')
      .select('role, roles')
      .eq('id', userId)
      .single();

    if (!profile) return false;

    const roles = profile.roles || [profile.role];
    return roles.some((r: string) => ['admin', 'super_admin'].includes(r));
  }

  /**
   * Get all users with pagination and filters
   */
  async findAll(currentUserId: string, query: UserQueryDto) {
    // Check admin privileges
    const isAdmin = await this.checkAdminRole(currentUserId);
    if (!isAdmin) {
      throw new ForbiddenException('Admin privileges required');
    }

    const { page = 1, limit = 10, search, role, is_active, is_banned, is_verified, sortBy = 'created_at', sortOrder = 'desc' } = query;

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Build query
    let dbQuery = this.adminClient
      .from('profiles')
      .select('*', { count: 'exact' });

    // Apply filters
    if (search) {
      dbQuery = dbQuery.or(`name.ilike.%${search}%,email.ilike.%${search}%,username.ilike.%${search}%`);
    }

    if (role) {
      dbQuery = dbQuery.eq('role', role);
    }

    if (is_active !== undefined) {
      dbQuery = dbQuery.eq('is_active', is_active);
    }

    if (is_banned !== undefined) {
      dbQuery = dbQuery.eq('is_banned', is_banned);
    }

    if (is_verified !== undefined) {
      dbQuery = dbQuery.eq('is_verified', is_verified);
    }

    // Apply sorting and pagination
    dbQuery = dbQuery
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(from, to);

    const { data: users, error, count } = await dbQuery;

    if (error) {
      this.logger.error('Error fetching users:', error);
      throw new BadRequestException(error.message);
    }

    return {
      users: users || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  }

  /**
   * Get user by ID
   */
  async findOne(currentUserId: string, userId: string) {
    // Check admin privileges
    const isAdmin = await this.checkAdminRole(currentUserId);
    if (!isAdmin) {
      throw new ForbiddenException('Admin privileges required');
    }

    const { data: user, error } = await this.adminClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Create a new user
   */
  async create(currentUserId: string, createDto: CreateUserDto) {
    // Check admin privileges
    const isAdmin = await this.checkAdminRole(currentUserId);
    if (!isAdmin) {
      throw new ForbiddenException('Admin privileges required');
    }

    const { email, password, name, username, phone, role = 'attendee', is_active = true } = createDto;

    // Create user in Supabase Auth
    const { data: newUser, error: createError } = await this.adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name: name || null,
        username: username || null,
      },
    });

    if (createError) {
      this.logger.error('Error creating user:', createError);
      throw new BadRequestException(`Failed to create user: ${createError.message}`);
    }

    // Update profile with additional fields
    const { data: updatedProfile, error: updateError } = await this.adminClient
      .from('profiles')
      .update({
        name: name || null,
        username: username || null,
        email: email,
        phone: phone || null,
        role: role,
        is_active: is_active,
      })
      .eq('id', newUser.user.id)
      .select()
      .single();

    if (updateError) {
      this.logger.error('Error updating profile:', updateError);
      throw new BadRequestException(`Failed to update profile: ${updateError.message}`);
    }

    return {
      user: updatedProfile,
      message: 'User created successfully',
    };
  }

  /**
   * Update user
   */
  async update(currentUserId: string, userId: string, updateDto: UpdateUserDto) {
    // Check admin privileges
    const isAdmin = await this.checkAdminRole(currentUserId);
    if (!isAdmin) {
      throw new ForbiddenException('Admin privileges required');
    }

    // Prevent self-modification of critical fields
    if (currentUserId === userId && (updateDto.role || updateDto.is_active !== undefined || updateDto.is_banned !== undefined)) {
      throw new ForbiddenException('Cannot modify your own role or status');
    }

    const { data: updatedUser, error } = await this.adminClient
      .from('profiles')
      .update(updateDto)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      this.logger.error('Error updating user:', error);
      throw new BadRequestException(error.message);
    }

    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    return {
      user: updatedUser,
      message: 'User updated successfully',
    };
  }

  /**
   * Delete user
   */
  async remove(currentUserId: string, userId: string) {
    // Check admin privileges
    const isAdmin = await this.checkAdminRole(currentUserId);
    if (!isAdmin) {
      throw new ForbiddenException('Admin privileges required');
    }

    // Prevent self-deletion
    if (currentUserId === userId) {
      throw new ForbiddenException('Cannot delete your own account');
    }

    // Delete user from Auth
    const { error: authError } = await this.adminClient.auth.admin.deleteUser(userId);

    if (authError) {
      this.logger.error('Error deleting user from auth:', authError);
      throw new BadRequestException(`Failed to delete user: ${authError.message}`);
    }

    return {
      message: 'User deleted successfully',
    };
  }

  /**
   * Bulk operations on users
   */
  async bulkOperation(currentUserId: string, bulkDto: BulkOperationDto) {
    // Check admin privileges
    const isAdmin = await this.checkAdminRole(currentUserId);
    if (!isAdmin) {
      throw new ForbiddenException('Admin privileges required');
    }

    const { action, userIds, reason } = bulkDto;

    // Prevent operations on self
    if (userIds.includes(currentUserId)) {
      throw new ForbiddenException('Cannot perform bulk operations on your own account');
    }

    let updateData: any = {};
    let result;

    switch (action) {
      case 'activate':
        updateData = { is_active: true };
        break;
      case 'deactivate':
        updateData = { is_active: false };
        break;
      case 'ban':
        updateData = { is_banned: true, is_active: false };
        break;
      case 'unban':
        updateData = { is_banned: false };
        break;
      case 'verify':
        updateData = { is_verified: true };
        break;
      case 'unverify':
        updateData = { is_verified: false };
        break;
      case 'promote_to_organizer':
        updateData = { role: 'organizer' };
        break;
      case 'demote_to_attendee':
        updateData = { role: 'attendee' };
        break;
      case 'delete':
        // Delete users
        for (const userId of userIds) {
          await this.adminClient.auth.admin.deleteUser(userId);
        }
        return {
          success: true,
          affected: userIds.length,
          message: `${userIds.length} user(s) deleted successfully`,
        };
      default:
        throw new BadRequestException('Invalid action');
    }

    // Update users
    const { data, error } = await this.adminClient
      .from('profiles')
      .update(updateData)
      .in('id', userIds)
      .select();

    if (error) {
      this.logger.error('Error performing bulk operation:', error);
      throw new BadRequestException(error.message);
    }

    return {
      success: true,
      affected: data?.length || 0,
      message: `${data?.length || 0} user(s) updated successfully`,
    };
  }

  /**
   * Get user statistics
   */
  async getStats(currentUserId: string) {
    // Check admin privileges
    const isAdmin = await this.checkAdminRole(currentUserId);
    if (!isAdmin) {
      throw new ForbiddenException('Admin privileges required');
    }

    // Get total users
    const { count: totalUsers } = await this.adminClient
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // Get active users
    const { count: activeUsers } = await this.adminClient
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    // Get banned users
    const { count: bannedUsers } = await this.adminClient
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_banned', true);

    // Get verified users
    const { count: verifiedUsers } = await this.adminClient
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_verified', true);

    // Get users by role
    const { data: roleStats } = await this.adminClient
      .from('profiles')
      .select('role')
      .not('role', 'is', null);

    const roleCounts = roleStats?.reduce((acc: any, user: any) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {}) || {};

    return {
      total: totalUsers || 0,
      active: activeUsers || 0,
      banned: bannedUsers || 0,
      verified: verifiedUsers || 0,
      by_role: roleCounts,
    };
  }
}
