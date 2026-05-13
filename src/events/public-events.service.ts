import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { SupabaseService } from '../common/database/supabase.service';
import { EventQueryDto } from './dto/event-query.dto';

/**
 * Public Events Service
 * Handles public event operations that don't require authentication
 */
@Injectable()
export class PublicEventsService {
  private readonly logger = new Logger(PublicEventsService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Get all published events (public access)
   */
  async findAllPublic(query: EventQueryDto) {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        category,
        event_type,
        city,
        is_free,
        is_featured,
        is_trending,
        organization_id,
      } = query;

      const offset = (page - 1) * limit;

      let queryBuilder = this.supabaseService
        .getClient()
        .from('events')
        .select(
          `
          *,
          organization:organizations (
            id,
            name,
            logo_url
          )
        `,
          { count: 'exact' },
        )
        .eq('status', 'published') // Only published events
        .order('start_date', { ascending: true });

      // Apply filters
      if (search) {
        queryBuilder = queryBuilder.or(
          `title.ilike.%${search}%,description.ilike.%${search}%,short_description.ilike.%${search}%`,
        );
      }

      if (category) {
        queryBuilder = queryBuilder.eq('category', category);
      }

      if (event_type) {
        queryBuilder = queryBuilder.eq('event_type', event_type);
      }

      if (city) {
        queryBuilder = queryBuilder.eq('city', city);
      }

      if (is_free !== undefined) {
        queryBuilder = queryBuilder.eq('is_free', is_free);
      }

      if (is_featured !== undefined) {
        queryBuilder = queryBuilder.eq('is_featured', is_featured);
      }

      if (is_trending !== undefined) {
        queryBuilder = queryBuilder.eq('is_trending', is_trending);
      }

      if (organization_id) {
        queryBuilder = queryBuilder.eq('organization_id', organization_id);
      }

      // Apply pagination
      queryBuilder = queryBuilder.range(offset, offset + limit - 1);

      const { data, error, count } = await queryBuilder;

      if (error) {
        this.logger.error(`Error fetching public events: ${error.message}`);
        throw error;
      }

      return {
        events: data || [],
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
   * Get featured events (public access)
   */
  async getFeaturedEvents(limit: number = 10) {
    try {
      const { data, error } = await this.supabaseService
        .getClient()
        .from('events')
        .select(
          `
          *,
          organization:organizations (
            id,
            name,
            logo_url
          )
        `,
        )
        .eq('status', 'published')
        .eq('is_featured', true)
        .order('start_date', { ascending: true })
        .limit(limit);

      if (error) {
        this.logger.error(`Error fetching featured events: ${error.message}`);
        throw error;
      }

      return {
        events: data || [],
      };
    } catch (error) {
      this.logger.error(
        `Unexpected error in getFeaturedEvents: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Get trending events (ongoing only, public access)
   */
  async getTrendingEvents(limit: number = 10) {
    try {
      const now = new Date().toISOString();

      const { data, error } = await this.supabaseService
        .getClient()
        .from('events')
        .select(
          `
          *,
          organization:organizations (
            id,
            name,
            logo_url
          )
        `,
        )
        .eq('status', 'published')
        .eq('is_trending', true)
        .lte('start_date', now) // Event has started
        .gte('end_date', now) // Event hasn't ended
        .order('start_date', { ascending: true })
        .limit(limit);

      if (error) {
        this.logger.error(`Error fetching trending events: ${error.message}`);
        throw error;
      }

      return {
        events: data || [],
      };
    } catch (error) {
      this.logger.error(
        `Unexpected error in getTrendingEvents: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Get event by ID (public access)
   */
  async findOnePublic(id: string) {
    try {
      const { data, error } = await this.supabaseService
        .getClient()
        .from('events')
        .select(
          `
          *,
          organization:organizations (
            id,
            name,
            slug,
            type,
            logo_url,
            description,
            website
          )
        `,
        )
        .eq('id', id)
        .eq('status', 'published') // Only published events
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new NotFoundException('Event not found');
        }
        this.logger.error(`Error fetching event: ${error.message}`);
        throw error;
      }

      return {
        event: data,
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
   * Get event by slug (public access)
   */
  async findBySlugPublic(slug: string) {
    try {
      const { data, error } = await this.supabaseService
        .getClient()
        .from('events')
        .select(
          `
          *,
          organization:organizations (
            id,
            name,
            slug,
            type,
            logo_url,
            description,
            website
          )
        `,
        )
        .eq('slug', slug)
        .eq('status', 'published') // Only published events
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new NotFoundException('Event not found');
        }
        this.logger.error(`Error fetching event by slug: ${error.message}`);
        throw error;
      }

      return {
        event: data,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Unexpected error in findBySlugPublic: ${error.message}`);
      throw error;
    }
  }
}
