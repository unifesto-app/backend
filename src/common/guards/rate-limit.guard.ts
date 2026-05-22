import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { SupabaseService } from '../database/supabase.service';
import { RequestUser } from '../../auth/interfaces/user.interface';

// Extend Express Request type
declare module 'express' {
  interface Request {
    user?: RequestUser;
  }
}

export const RATE_LIMIT_KEY = 'rateLimit';

export interface RateLimitOptions {
  maxRequests: number;
  windowMinutes: number;
  skipAuth?: boolean; // If true, use IP instead of user ID
}

export const RateLimit = (options: RateLimitOptions) =>
  Reflect.metadata(RATE_LIMIT_KEY, options);

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly supabaseService: SupabaseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const rateLimitOptions = this.reflector.get<RateLimitOptions>(
      RATE_LIMIT_KEY,
      context.getHandler(),
    );

    if (!rateLimitOptions) {
      return true; // No rate limit configured
    }

    const request = context.switchToHttp().getRequest<Request>();
    const endpoint = `${request.method}:${request.route?.path || request.path}`;

    // Get identifier (user ID or IP address)
    let identifier: string;
    if (rateLimitOptions.skipAuth || !request['user']) {
      identifier = this.getClientIp(request);
    } else {
      identifier = request['user']?.sub || this.getClientIp(request);
    }

    try {
      const { data, error } = await this.supabaseService
        .getClient()
        .rpc('check_rate_limit', {
          p_identifier: identifier,
          p_endpoint: endpoint,
          p_max_requests: rateLimitOptions.maxRequests,
          p_window_minutes: rateLimitOptions.windowMinutes,
        }) as { data: any, error: any };

      if (error) {
        this.logger.error('Rate limit check failed', error);
        // Allow request on error to prevent blocking legitimate traffic
        return true;
      }

      if (data && !data.allowed) {
        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: 'Too many requests',
            error: 'Rate limit exceeded',
            retryAfter: data.retry_after,
            limit: {
              max: data.max_requests,
              current: data.current_count,
              windowStart: data.window_start,
              windowEnd: data.window_end,
            },
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      // Add rate limit info to response headers
      const response = context.switchToHttp().getResponse();
      if (data) {
        response.setHeader('X-RateLimit-Limit', data.max_requests);
        response.setHeader('X-RateLimit-Remaining', data.max_requests - data.current_count);
        response.setHeader('X-RateLimit-Reset', new Date(data.window_end).toISOString());
      }

      return true;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error('Unexpected error in rate limit guard', error);
      return true; // Allow on unexpected errors
    }
  }

  private getClientIp(request: Request): string {
    return (
      (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      (request.headers['x-real-ip'] as string) ||
      request.socket.remoteAddress ||
      'unknown'
    );
  }
}
