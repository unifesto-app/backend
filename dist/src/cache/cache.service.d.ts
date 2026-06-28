import { RedisService } from '../redis/redis.service';
import { OrgPlan } from '@prisma/client';
interface Partner {
    id: string;
    name: string;
    slug: string;
    apiKey: string;
    isActive: boolean;
    maxCoinsPerTxn: number | null;
}
export declare class CacheService {
    private readonly redis;
    private readonly logger;
    constructor(redis: RedisService);
    getUserPlan(userId: string): Promise<OrgPlan | null>;
    setUserPlan(userId: string, plan: OrgPlan): Promise<void>;
    invalidatePlanCache(userId: string): Promise<void>;
    reserveTickets(eventId: string, ticketTypeId: string, userId: string, quantity: number): Promise<boolean>;
    getTicketLock(eventId: string, ticketTypeId: string, userId: string): Promise<number | null>;
    releaseTicketLock(eventId: string, ticketTypeId: string, userId: string): Promise<void>;
    getCheckinCache(eventId: string): Promise<any[] | null>;
    getEventRegistrationsForCheckin(eventId: string): Promise<any[] | null>;
    setCheckinCache(eventId: string, registrations: any[]): Promise<void>;
    setEventRegistrationsForCheckin(eventId: string, registrations: any[]): Promise<void>;
    invalidateCheckinCache(eventId: string): Promise<void>;
    getCachedBalance(userId: string): Promise<number | null>;
    setCachedBalance(userId: string, balance: number): Promise<void>;
    invalidateBalanceCache(userId: string): Promise<void>;
    getCachedEvent(slug: string): Promise<any | null>;
    setCachedEvent(slug: string, event: any): Promise<void>;
    invalidateEventCache(slug: string): Promise<void>;
    incrementEventScore(eventId: string): Promise<void>;
    getTrendingEventIds(limit?: number): Promise<string[]>;
    incrementEventViews(eventId: string): Promise<void>;
    getEventViews(eventId: string): Promise<number>;
    checkIdempotency(action: string, userId: string, referenceId: string): Promise<boolean>;
    trackFailedOtp(identifier: string): Promise<number>;
    isOtpBlocked(identifier: string): Promise<boolean>;
    clearFailedOtp(identifier: string): Promise<void>;
    getCachedPartner(apiKey: string): Promise<Partner | null>;
    validatePartnerApiKey(apiKey: string): Promise<Partner | null>;
    setCachedPartner(apiKey: string, partner: Partner): Promise<void>;
    setPartnerApiKey(apiKey: string, partner: Partner): Promise<void>;
    invalidatePartnerCache(apiKey: string): Promise<void>;
    clearAllCache(): Promise<void>;
    getCacheStats(): Promise<any>;
}
export {};
