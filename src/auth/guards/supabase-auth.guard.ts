import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import type { JwtPayload, RequestUser } from '../interfaces/user.interface';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  private readonly logger = new Logger(SupabaseAuthGuard.name);

  canActivate(context: ExecutionContext): boolean {
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

    const jwtSecret = process.env.SUPABASE_JWT_SECRET;
    if (!jwtSecret) {
      this.logger.error('SUPABASE_JWT_SECRET is not configured');
      throw new UnauthorizedException('Authentication service misconfigured');
    }

    try {
      // Log token prefix for debugging (first 20 chars only)
      this.logger.debug(`Verifying token: ${token.substring(0, 20)}...`);
      
      const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

      if (!decoded.sub) {
        this.logger.warn('Token missing user ID (sub)');
        throw new UnauthorizedException('Invalid token payload');
      }

      // Attach user info to request
      const user: RequestUser = {
        sub: decoded.sub,
        email: decoded.email,
        role: decoded.role,
      };

      request.user = user;

      this.logger.log(`User authenticated: ${decoded.sub}`);
      return true;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        this.logger.warn('Token expired');
        throw new UnauthorizedException('Token has expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        this.logger.warn(`Invalid token: ${error.message}`);
        this.logger.debug(`JWT Secret length: ${jwtSecret.length} chars`);
        throw new UnauthorizedException('Invalid token');
      }
      this.logger.error(`Authentication error: ${error.message}`);
      throw new UnauthorizedException('Authentication failed');
    }
  }
}
