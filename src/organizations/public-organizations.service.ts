import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { SupabaseService } from '../common/database/supabase.service';

interface OrganizationQueryDto {
  page?: number;
  limit?: number;
  search?: string;
}

/**
 * Public Organizations Service
 * Handles public organization operations that don't require authentication
 */
@Injectable()
export class PublicOrganizationsService {
  private readonly logger = new Logger(PublicOrganizationsService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Get all active organizations (public access)
   */
  async findAllPublic(query: OrganizationQueryDto) {
    try {
      const { page = 1, limit = 20, search } = query;
      const offset = (page - 1) * limit;

      let queryBuilder = this.supabaseService
        .getClient()
        .from('organizations')
        .select('*', { count: 'exact' })
        .eq('is_active', true)
        .order('name', { ascending: true });

      // Apply search filter
      if (search) {
        queryBuilder = queryBuilder.or(
          `name.ilike.%${search}%,description.ilike.%${search}%`,
        );
      }

      // Apply pagination
      queryBuilder = queryBuilder.range(offset, offset + limit - 1);

      const { data, error, count } = await queryBuilder;

      if (error) {
        this.logger.error(
          `Error fetching public organizations: ${error.message}`,
        );
        throw error;
      }

      return {
        organizations: data || [],
        total: count || 0,
        page,
        limit,
      };
    } catch (error) {
      this.logger.error(`Unexpected error in findAllPublic: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get organization by ID (public access)
   */
  async findOnePublic(id: string) {
    try {
      const { data, error } = await this.supabaseService
        .getClient()
        .from('organizations')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new NotFoundException('Organization not found');
        }
        this.logger.error(`Error fetching organization: ${error.message}`);
        throw error;
      }

      return {
        organization: data,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Unexpected error in findOnePublic: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get organization's published events (public access)
   */
  async getOrganizationEvents(
    organizationId: string,
    query: { page?: number; limit?: number },
  ) {
    try {
      const { page = 1, limit = 20 } = query;
      const offset = (page - 1) * limit;

      // First verify organization exists and is active
      const { data: org, error: orgError } = await this.supabaseService
        .getClient()
        .from('organizations')
        .select('id')
        .eq('id', organizationId)
        .eq('is_active', true)
        .single();

      if (orgError || !org) {
        throw new NotFoundException('Organization not found');
      }

      // Get organization's published events
      const { data, error, count } = await this.supabaseService
        .getClient()
        .from('events')
        .select('*', { count: 'exact' })
        .eq('organization_id', organizationId)
        .eq('status', 'published')
        .order('start_date', { ascending: true })
        .range(offset, offset + limit - 1);

      if (error) {
        this.logger.error(
          `Error fetching organization events: ${error.message}`,
        );
        throw error;
      }

      return {
        events: data || [],
        total: count || 0,
        page,
        limit,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Unexpected error in getOrganizationEvents: ${error.message}`,
      );
      throw error;
    }
  }
}
