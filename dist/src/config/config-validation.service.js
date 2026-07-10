"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ConfigValidationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigValidationService = void 0;
const common_1 = require("@nestjs/common");
let ConfigValidationService = ConfigValidationService_1 = class ConfigValidationService {
    logger = new common_1.Logger(ConfigValidationService_1.name);
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
        const missing = requiredVars.filter((key) => !process.env[key]);
        if (missing.length > 0) {
            const errorMessage = `Missing required environment variables: ${missing.join(', ')}`;
            this.logger.error(errorMessage);
            throw new Error(errorMessage);
        }
        const databaseUrl = process.env.DATABASE_URL;
        if (!databaseUrl?.includes('sslmode=require')) {
            const errorMessage = 'DATABASE_URL must include sslmode=require parameter for secure RDS connection';
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
};
exports.ConfigValidationService = ConfigValidationService;
exports.ConfigValidationService = ConfigValidationService = ConfigValidationService_1 = __decorate([
    (0, common_1.Injectable)()
], ConfigValidationService);
//# sourceMappingURL=config-validation.service.js.map