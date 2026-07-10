import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';
export declare class OtpService {
    private readonly configService;
    private readonly redisService;
    private readonly logger;
    private readonly OTP_LENGTH;
    private readonly OTP_EXPIRY_SECONDS;
    private readonly MAX_ATTEMPTS;
    constructor(configService: ConfigService, redisService: RedisService);
    generateOtp(): string;
    storeOtp(identifier: string, otp: string): Promise<void>;
    verifyOtp(identifier: string, otp: string): Promise<boolean>;
    hasValidOtp(identifier: string): Promise<boolean>;
    deleteOtp(identifier: string): Promise<void>;
}
