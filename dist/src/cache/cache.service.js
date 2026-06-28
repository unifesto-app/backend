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
var CacheService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheService = void 0;
const common_1 = require("@nestjs/common");
const redis_service_1 = require("../redis/redis.service");
let CacheService = CacheService_1 = class CacheService {
    redis;
    logger = new common_1.Logger(CacheService_1.name);
    constructor(redis) {
        this.redis = redis;
    }
    async getUserPlan(userId) {
        try {
            const cacheKey = `plan:${userId}`;
            const cached = await this.redis.get(cacheKey);
            if (cached) {
                this.logger.debug(`Cache hit: ${cacheKey}`);
                return cached;
            }
            this.logger.debug(`Cache miss: ${cacheKey}`);
            return null;
        }
        catch (error) {
            this.logger.error(`Cache get error for plan:${userId}`, error);
            return null;
        }
    }
    async setUserPlan(userId, plan) {
        try {
            const cacheKey = `plan:${userId}`;
            await this.redis.set(cacheKey, plan, 3600);
            this.logger.debug(`Cache set: ${cacheKey}`);
        }
        catch (error) {
            this.logger.error(`Cache set error for plan:${userId}`, error);
        }
    }
    async invalidatePlanCache(userId) {
        try {
            const cacheKey = `plan:${userId}`;
            await this.redis.del(cacheKey);
            this.logger.debug(`Cache invalidated: ${cacheKey}`);
        }
        catch (error) {
            this.logger.error(`Cache delete error for plan:${userId}`, error);
        }
    }
    async reserveTickets(eventId, ticketTypeId, userId, quantity) {
        try {
            const lockKey = `ticket:lock:${eventId}:${ticketTypeId}:${userId}`;
            const existing = await this.redis.get(lockKey);
            if (existing) {
                this.logger.debug(`Ticket lock already exists: ${lockKey}`);
                return true;
            }
            await this.redis.set(lockKey, quantity.toString(), 300);
            this.logger.debug(`Ticket lock set: ${lockKey} for ${quantity} tickets`);
            return true;
        }
        catch (error) {
            this.logger.error(`Ticket reservation error for event:${eventId}, ticket:${ticketTypeId}`, error);
            return false;
        }
    }
    async getTicketLock(eventId, ticketTypeId, userId) {
        try {
            const lockKey = `ticket:lock:${eventId}:${ticketTypeId}:${userId}`;
            const quantity = await this.redis.get(lockKey);
            return quantity ? parseInt(quantity) : null;
        }
        catch (error) {
            this.logger.error(`Get ticket lock error`, error);
            return null;
        }
    }
    async releaseTicketLock(eventId, ticketTypeId, userId) {
        try {
            const lockKey = `ticket:lock:${eventId}:${ticketTypeId}:${userId}`;
            await this.redis.del(lockKey);
            this.logger.debug(`Ticket lock released: ${lockKey}`);
        }
        catch (error) {
            this.logger.error(`Release ticket lock error`, error);
        }
    }
    async getCheckinCache(eventId) {
        try {
            const cacheKey = `checkin:cache:${eventId}`;
            const cached = await this.redis.get(cacheKey);
            if (cached) {
                this.logger.debug(`Cache hit: ${cacheKey}`);
                return JSON.parse(cached);
            }
            this.logger.debug(`Cache miss: ${cacheKey}`);
            return null;
        }
        catch (error) {
            this.logger.error(`Get checkin cache error for event:${eventId}`, error);
            return null;
        }
    }
    async getEventRegistrationsForCheckin(eventId) {
        return this.getCheckinCache(eventId);
    }
    async setCheckinCache(eventId, registrations) {
        try {
            const cacheKey = `checkin:cache:${eventId}`;
            await this.redis.set(cacheKey, JSON.stringify(registrations), 3600);
            this.logger.debug(`Cache set: ${cacheKey} with ${registrations.length} registrations`);
        }
        catch (error) {
            this.logger.error(`Set checkin cache error for event:${eventId}`, error);
        }
    }
    async setEventRegistrationsForCheckin(eventId, registrations) {
        return this.setCheckinCache(eventId, registrations);
    }
    async invalidateCheckinCache(eventId) {
        try {
            const cacheKey = `checkin:cache:${eventId}`;
            await this.redis.del(cacheKey);
            this.logger.debug(`Cache invalidated: ${cacheKey}`);
        }
        catch (error) {
            this.logger.error(`Invalidate checkin cache error for event:${eventId}`, error);
        }
    }
    async getCachedBalance(userId) {
        try {
            const cacheKey = `wallet:balance:${userId}`;
            const cached = await this.redis.get(cacheKey);
            if (cached) {
                this.logger.debug(`Cache hit: ${cacheKey}`);
                return parseInt(cached);
            }
            this.logger.debug(`Cache miss: ${cacheKey}`);
            return null;
        }
        catch (error) {
            this.logger.error(`Get wallet balance cache error for user:${userId}`, error);
            return null;
        }
    }
    async setCachedBalance(userId, balance) {
        try {
            const cacheKey = `wallet:balance:${userId}`;
            await this.redis.set(cacheKey, balance.toString(), 300);
            this.logger.debug(`Cache set: ${cacheKey} = ${balance}`);
        }
        catch (error) {
            this.logger.error(`Set wallet balance cache error for user:${userId}`, error);
        }
    }
    async invalidateBalanceCache(userId) {
        try {
            const cacheKey = `wallet:balance:${userId}`;
            await this.redis.del(cacheKey);
            this.logger.debug(`Cache invalidated: ${cacheKey}`);
        }
        catch (error) {
            this.logger.error(`Invalidate wallet balance cache error for user:${userId}`, error);
        }
    }
    async getCachedEvent(slug) {
        try {
            const cacheKey = `event:details:${slug}`;
            const cached = await this.redis.get(cacheKey);
            if (cached) {
                this.logger.debug(`Cache hit: ${cacheKey}`);
                return JSON.parse(cached);
            }
            this.logger.debug(`Cache miss: ${cacheKey}`);
            return null;
        }
        catch (error) {
            this.logger.error(`Get event cache error for slug:${slug}`, error);
            return null;
        }
    }
    async setCachedEvent(slug, event) {
        try {
            const cacheKey = `event:details:${slug}`;
            await this.redis.set(cacheKey, JSON.stringify(event), 600);
            this.logger.debug(`Cache set: ${cacheKey}`);
        }
        catch (error) {
            this.logger.error(`Set event cache error for slug:${slug}`, error);
        }
    }
    async invalidateEventCache(slug) {
        try {
            const cacheKey = `event:details:${slug}`;
            await this.redis.del(cacheKey);
            this.logger.debug(`Cache invalidated: ${cacheKey}`);
        }
        catch (error) {
            this.logger.error(`Invalidate event cache error for slug:${slug}`, error);
        }
    }
    async incrementEventScore(eventId) {
        try {
            const client = this.redis.getClient();
            if (!client) {
                this.logger.warn('Redis client not available for trending events');
                return;
            }
            await client.zincrby('trending:events', 1, eventId);
            this.logger.debug(`Incremented trending score for event:${eventId}`);
        }
        catch (error) {
            this.logger.error(`Increment event score error for event:${eventId}`, error);
        }
    }
    async getTrendingEventIds(limit = 10) {
        try {
            const client = this.redis.getClient();
            if (!client) {
                this.logger.warn('Redis client not available for trending events');
                return [];
            }
            const eventIds = await client.zrevrange('trending:events', 0, limit - 1);
            this.logger.debug(`Retrieved ${eventIds.length} trending event IDs`);
            return eventIds;
        }
        catch (error) {
            this.logger.error('Get trending events error', error);
            return [];
        }
    }
    async incrementEventViews(eventId) {
        try {
            const client = this.redis.getClient();
            if (!client)
                return;
            await client.incr(`event:views:${eventId}`);
            this.logger.debug(`Incremented view count for event:${eventId}`);
        }
        catch (error) {
            this.logger.error(`Increment event views error for event:${eventId}`, error);
        }
    }
    async getEventViews(eventId) {
        try {
            const client = this.redis.getClient();
            if (!client)
                return 0;
            const count = await client.get(`event:views:${eventId}`);
            return parseInt(count || '0');
        }
        catch (error) {
            this.logger.error(`Get event views error for event:${eventId}`, error);
            return 0;
        }
    }
    async checkIdempotency(action, userId, referenceId) {
        try {
            const key = `idempotency:${action}:${userId}:${referenceId}`;
            const exists = await this.redis.get(key);
            if (exists) {
                this.logger.debug(`Idempotency check failed (already processed): ${key}`);
                return false;
            }
            await this.redis.set(key, '1', 86400);
            this.logger.debug(`Idempotency key set: ${key}`);
            return true;
        }
        catch (error) {
            this.logger.error(`Idempotency check error for ${action}:${userId}:${referenceId}`, error);
            return true;
        }
    }
    async trackFailedOtp(identifier) {
        try {
            const client = this.redis.getClient();
            if (!client)
                return 0;
            const key = `failed:otp:${identifier}`;
            const count = await client.incr(key);
            if (count === 1) {
                await client.expire(key, 900);
            }
            this.logger.debug(`Failed OTP attempt ${count} for ${identifier}`);
            return count;
        }
        catch (error) {
            this.logger.error(`Track failed OTP error for ${identifier}`, error);
            return 0;
        }
    }
    async isOtpBlocked(identifier) {
        try {
            const client = this.redis.getClient();
            if (!client)
                return false;
            const count = await client.get(`failed:otp:${identifier}`);
            const attempts = parseInt(count || '0');
            if (attempts >= 5) {
                this.logger.warn(`OTP blocked for ${identifier} (${attempts} attempts)`);
                return true;
            }
            return false;
        }
        catch (error) {
            this.logger.error(`Check OTP blocked error for ${identifier}`, error);
            return false;
        }
    }
    async clearFailedOtp(identifier) {
        try {
            const key = `failed:otp:${identifier}`;
            await this.redis.del(key);
            this.logger.debug(`Cleared failed OTP attempts for ${identifier}`);
        }
        catch (error) {
            this.logger.error(`Clear failed OTP error for ${identifier}`, error);
        }
    }
    async getCachedPartner(apiKey) {
        try {
            const cacheKey = `partner:apikey:${apiKey}`;
            const cached = await this.redis.get(cacheKey);
            if (cached) {
                this.logger.debug(`Cache hit: ${cacheKey}`);
                return JSON.parse(cached);
            }
            this.logger.debug(`Cache miss: ${cacheKey}`);
            return null;
        }
        catch (error) {
            this.logger.error('Get cached partner error', error);
            return null;
        }
    }
    async validatePartnerApiKey(apiKey) {
        return this.getCachedPartner(apiKey);
    }
    async setCachedPartner(apiKey, partner) {
        try {
            const cacheKey = `partner:apikey:${apiKey}`;
            await this.redis.set(cacheKey, JSON.stringify(partner), 3600);
            this.logger.debug(`Cache set: ${cacheKey}`);
        }
        catch (error) {
            this.logger.error('Set cached partner error', error);
        }
    }
    async setPartnerApiKey(apiKey, partner) {
        return this.setCachedPartner(apiKey, partner);
    }
    async invalidatePartnerCache(apiKey) {
        try {
            const cacheKey = `partner:apikey:${apiKey}`;
            await this.redis.del(cacheKey);
            this.logger.debug(`Cache invalidated: ${cacheKey}`);
        }
        catch (error) {
            this.logger.error('Invalidate partner cache error', error);
        }
    }
    async clearAllCache() {
        try {
            const client = this.redis.getClient();
            if (!client) {
                this.logger.warn('Redis client not available for cache clear');
                return;
            }
            this.logger.warn('Clear all cache called - implement with caution');
        }
        catch (error) {
            this.logger.error('Clear all cache error', error);
        }
    }
    async getCacheStats() {
        try {
            const client = this.redis.getClient();
            if (!client)
                return { available: false };
            const info = await client.info('stats');
            return {
                available: true,
                info,
            };
        }
        catch (error) {
            this.logger.error('Get cache stats error', error);
            return { available: false, error: error.message };
        }
    }
};
exports.CacheService = CacheService;
exports.CacheService = CacheService = CacheService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [redis_service_1.RedisService])
], CacheService);
//# sourceMappingURL=cache.service.js.map