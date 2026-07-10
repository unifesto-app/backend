import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import helmet from 'helmet';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    // Preserve the raw request body so webhook signatures (e.g. WhatsApp/Meta)
    // can be verified against the exact bytes that were signed.
    rawBody: true,
  });

  // Remove the X-Powered-By header (avoids advertising the Express stack)
  app.getHttpAdapter().getInstance().disable('x-powered-by');

  // Security headers: CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, etc.
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          frameAncestors: ["'none'"],
        },
      },
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    }),
  );

  // Enable CORS for all Unifesto subdomains
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, curl, etc.)
      if (!origin) {
        callback(null, true);
        return;
      }

      // Only allow *.unifesto.app subdomains, the apex domain, and localhost for dev.
      // Credentialed requests must never be allowed from an arbitrary reflected origin.
      const isAllowed =
        origin.endsWith('.unifesto.app') ||
        origin === 'https://unifesto.app' ||
        origin.startsWith('http://localhost');

      if (isAllowed) {
        callback(null, true);
      } else {
        logger.warn(`Blocked CORS request from disallowed origin: ${origin}`);
        callback(new Error('Not allowed by CORS'), false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['Content-Length', 'Content-Type'],
    maxAge: 86400, // 24 hours
  });

  // Catch-all exception filter: logs stack traces and returns clean JSON.
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Enable validation pipes globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that don't have decorators
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties are present
      transform: true, // Automatically transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  logger.log(`Application is running on: http://localhost:${port}`);
  logger.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
}
bootstrap();
