import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { SupabaseService } from '../../common/database/supabase.service';
import type { RequestUser } from '../interfaces/user.interface';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  private readonly logger = new Logger(SupabaseAuthGuard.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const authHeader = request.headers.authorization;
    if (!authHeader) {
      this.logger.warn('Authentication attempt without authorization header');
      throw new UnauthorizedException('No authorization token provided');
    }

    if (!authHeader.startsWith('Bearer ')) {
      this.logger.warn('Invalid authorization header format');
      throw new UnauthorizedException('Invalid authorization header format');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      // Log token prefix for debugging (first 20 chars only)
      this.logger.debug(`Verifying token: ${token.substring(0, 20)}...`);

      // Use Supabase client to verify the JWT token (handles ES256)
      const {
        data: { user },
        error,
      } = await this.supabaseService.getClient().auth.getUser(token);

      if (error || !user) {
        this.logger.warn(`Token verification failed: ${error?.message || 'No user found'}`);
        throw new UnauthorizedException('Invalid token');
      }

      // Attach user info to request
      const requestUser: RequestUser = {
        sub: user.id,
        email: user.email,
        role: user.role,
      };

      request.user = requestUser;

      this.logger.log(`User authenticated: ${user.id}`);
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`Authentication error: ${error.message}`);
      throw new UnauthorizedException('Authentication failed');
    }
  }
}
