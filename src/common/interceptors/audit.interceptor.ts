import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request } from 'express';
import { AuditService } from '../audit/audit.service';
import { RequestUser } from '../../auth/interfaces/user.interface';

// Extend Express Request type
declare module 'express' {
  interface Request {
    user?: RequestUser;
  }
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url, body, headers } = request;
    const user = request['user'];

    const action = this.getActionFromRequest(method, url);
    const resourceType = this.getResourceTypeFromUrl(url);
    const ipAddress = this.getClientIp(request);
    const userAgent = headers['user-agent'];

    const startTime = Date.now();

    return next.handle().pipe(
      tap((response) => {
        const duration = Date.now() - startTime;

        // Log successful request
        this.auditService
          .logSuccess(action, resourceType, {
            userId: user?.sub,
            resourceId: this.extractResourceId(url, response),
            details: {
              method,
              url,
              duration,
              statusCode: 200,
              body: this.sanitizeBody(body),
            },
            ipAddress,
            userAgent,
            project: 'backend',
          })
          .catch((error) => {
            this.logger.error('Failed to log audit success', error);
          });
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;

        // Log failed request
        this.auditService
          .logFailure(action, resourceType, error.message || 'Unknown error', {
            userId: user?.sub,
            details: {
              method,
              url,
              duration,
              statusCode: error.status || 500,
              body: this.sanitizeBody(body),
              errorStack: error.stack,
            },
            ipAddress,
            userAgent,
            project: 'backend',
          })
          .catch((logError) => {
            this.logger.error('Failed to log audit failure', logError);
          });

        return throwError(() => error);
      }),
    );
  }

  private getActionFromRequest(method: string, url: string): string {
    const path = url.split('?')[0];
    const segments = path.split('/').filter(Boolean);

    // Extract meaningful action
    if (method === 'GET') {
      return segments.length > 1 ? `view_${segments[segments.length - 1]}` : 'view';
    } else if (method === 'POST') {
      return segments.length > 1 ? `create_${segments[segments.length - 1]}` : 'create';
    } else if (method === 'PATCH' || method === 'PUT') {
      return segments.length > 1 ? `update_${segments[segments.length - 2] || segments[segments.length - 1]}` : 'update';
    } else if (method === 'DELETE') {
      return segments.length > 1 ? `delete_${segments[segments.length - 2] || segments[segments.length - 1]}` : 'delete';
    }

    return method.toLowerCase();
  }

  private getResourceTypeFromUrl(url: string): string {
    const path = url.split('?')[0];
    const segments = path.split('/').filter(Boolean);

    // Extract resource type from URL
    if (segments.length > 0) {
      // Remove IDs and get the resource name
      const resourceSegment = segments.find(
        (seg) => !this.isUUID(seg) && !this.isNumeric(seg),
      );
      return resourceSegment || segments[0];
    }

    return 'unknown';
  }

  private extractResourceId(url: string, response?: any): string | undefined {
    // Try to extract ID from URL
    const segments = url.split('/').filter(Boolean);
    const idSegment = segments.find((seg) => this.isUUID(seg) || this.isNumeric(seg));

    if (idSegment) {
      return idSegment;
    }

    // Try to extract ID from response
    if (response && typeof response === 'object') {
      return response.id || response.data?.id;
    }

    return undefined;
  }

  private isUUID(str: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  }

  private isNumeric(str: string): boolean {
    return /^\d+$/.test(str);
  }

  private getClientIp(request: Request): string {
    return (
      (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      (request.headers['x-real-ip'] as string) ||
      request.socket.remoteAddress ||
      'unknown'
    );
  }

  private sanitizeBody(body: any): any {
    if (!body || typeof body !== 'object') {
      return body;
    }

    // Remove sensitive fields
    const sensitiveFields = [
      'password',
      'passcode',
      'token',
      'secret',
      'apiKey',
      'api_key',
      'authorization',
    ];

    const sanitized = { ...body };
    sensitiveFields.forEach((field) => {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***';
      }
    });

    return sanitized;
  }
}
