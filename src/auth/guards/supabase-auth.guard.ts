import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    const authHeader = request.headers.authorization;
    if (!authHeader) throw new UnauthorizedException('No token');

    const token = authHeader.split(' ')[1];
    const jwtSecret = process.env.SUPABASE_JWT_SECRET;

    if (!jwtSecret) {
      throw new UnauthorizedException('JWT secret not configured');
    }

    try {
      const decoded: any = jwt.verify(token, jwtSecret);

      request.user = decoded; // contains sub (user id)
      return true;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
