import { Injectable, OnModuleInit, Logger } from '@nestjs/common';

@Injectable()
export class ConfigValidationService implements OnModuleInit {
  private readonly logger = new Logger(ConfigValidationService.name);

  async onModuleInit() {
    this.logger.log('Validating environment configuration...');

    const requiredVars = [
      'AWS_REGION',
      'S3_BUCKET_NAME',
      'COGNITO_USER_POOL_ID',
      'COGNITO_CLIENT_ID',
      'REDIS_HOST',
      'REDIS_PORT',
      'REDIS_TLS',
      'DATABASE_URL',
      'RAZORPAY_KEY_ID',
      'RAZORPAY_KEY_SECRET',
      'RAZORPAY_WEBHOOK_SECRET',
    ];

    // Check for missing environment variables
    const missing = requiredVars.filter((key) => !process.env[key]);

    if (missing.length > 0) {
      const errorMessage = `Missing required environment variables: ${missing.join(', ')}`;
      this.logger.error(errorMessage);
      throw new Error(errorMessage);
    }

    // Validate DATABASE_URL contains sslmode=require parameter
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl?.includes('sslmode=require')) {
      const errorMessage =
        'DATABASE_URL must include sslmode=require parameter for secure RDS connection';
      this.logger.error(errorMessage);
      throw new Error(errorMessage);
    }

    this.logger.log('Environment configuration validated successfully');
    this.logger.log(`AWS Region: ${process.env.AWS_REGION}`);
    this.logger.log(`S3 Bucket: ${process.env.S3_BUCKET_NAME}`);
    this.logger.log(`Redis Host: ${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`);
    this.logger.log(`Redis TLS: ${process.env.REDIS_TLS}`);
    this.logger.log(`Razorpay configured: ${!!process.env.RAZORPAY_KEY_ID}`);
  }
}
