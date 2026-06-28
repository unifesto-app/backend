"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var OtpService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OtpService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const redis_service_1 = require("../redis/redis.service");
let OtpService = OtpService_1 = class OtpService {
    configService;
    redisService;
    logger = new common_1.Logger(OtpService_1.name);
    OTP_LENGTH = 6;
    OTP_EXPIRY_SECONDS = 10 * 60;
    MAX_ATTEMPTS = 5;
    constructor(configService, redisService) {
        this.configService = configService;
        this.redisService = redisService;
    }
    generateOtp() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }
    async storeOtp(identifier, otp) {
        const key = `otp:${identifier}`;
        const data = JSON.stringify({ otp, attempts: 0 });
        await this.redisService.set(key, data, this.OTP_EXPIRY_SECONDS);
        this.logger.log(`OTP stored in Redis for ${identifier}`);
    }
    async verifyOtp(identifier, otp) {
        const key = `otp:${identifier}`;
        const raw = await this.redisService.get(key);
        if (!raw) {
            this.logger.warn(`No OTP found for ${identifier}`);
            return false;
        }
        const data = JSON.parse(raw);
        if (data.attempts >= this.MAX_ATTEMPTS) {
            this.logger.warn(`Max attempts reached for ${identifier}`);
            await this.redisService.del(key);
            return false;
        }
        data.attempts++;
        await this.redisService.set(key, JSON.stringify(data), this.OTP_EXPIRY_SECONDS);
        if (data.otp === otp) {
            this.logger.log(`OTP verified for ${identifier}`);
            await this.redisService.del(key);
            return true;
        }
        this.logger.warn(`Invalid OTP for ${identifier}. Attempt ${data.attempts}/${this.MAX_ATTEMPTS}`);
        return false;
    }
    async hasValidOtp(identifier) {
        const key = `otp:${identifier}`;
        const raw = await this.redisService.get(key);
        return !!raw;
    }
    async deleteOtp(identifier) {
        const key = `otp:${identifier}`;
        await this.redisService.del(key);
    }
};
exports.OtpService = OtpService;
exports.OtpService = OtpService = OtpService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        redis_service_1.RedisService])
], OtpService);
//# sourceMappingURL=otp.service.js.map