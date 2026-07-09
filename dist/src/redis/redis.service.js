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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var RedisService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ioredis_1 = __importDefault(require("ioredis"));
let RedisService = RedisService_1 = class RedisService {
    configService;
    logger = new common_1.Logger(RedisService_1.name);
    client = null;
    healthy = false;
    constructor(configService) {
        this.configService = configService;
    }
    async onModuleInit() {
        await this.initializeClient();
    }
    async onModuleDestroy() {
        if (this.client) {
            await this.client.quit();
            this.logger.log('Redis client disconnected');
        }
    }
    async initializeClient() {
        const host = this.configService.get('REDIS_HOST');
        const port = this.configService.get('REDIS_PORT');
        const tlsEnabled = this.configService.get('REDIS_TLS') === 'true';
        if (!host || !port) {
            this.logger.error('Redis configuration missing - REDIS_HOST or REDIS_PORT not set');
            return;
        }
        const retryDelays = [1000, 2000, 4000];
        let attempt = 0;
        const retryStrategy = (times) => {
            if (times > retryDelays.length) {
                this.logger.error('Redis connection failed after maximum retry attempts', {
                    host,
                    port,
                    tls: tlsEnabled,
                    attempts: retryDelays.length,
                });
                return null;
            }
            const delay = retryDelays[times - 1];
            this.logger.warn(`Redis connection attempt ${times} failed, retrying in ${delay}ms`);
            return delay;
        };
        try {
            this.client = new ioredis_1.default({
                host,
                port,
                tls: tlsEnabled ? {} : undefined,
                retryStrategy,
                maxRetriesPerRequest: 3,
                enableReadyCheck: true,
                lazyConnect: false,
            });
            this.client.on('connect', () => {
                this.logger.log('Redis client connecting...');
            });
            this.client.on('ready', () => {
                this.healthy = true;
                this.logger.log('Redis connection established successfully', {
                    host,
                    port,
                    tls: tlsEnabled,
                });
            });
            this.client.on('error', (error) => {
                this.healthy = false;
                this.logger.error('Redis connection error', {
                    host,
                    port,
                    tls: tlsEnabled,
                    error: error.message,
                });
            });
            this.client.on('close', () => {
                this.healthy = false;
                this.logger.warn('Redis connection closed');
            });
            this.client.on('reconnecting', () => {
                this.logger.log('Redis client reconnecting...');
            });
            await this.client.ping();
            this.logger.log('Redis ping successful');
        }
        catch (error) {
            this.healthy = false;
            this.client = null;
            this.logger.error('Redis initialization failed - application will continue with degraded functionality', {
                host,
                port,
                tls: tlsEnabled,
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }
    getClient() {
        return this.client;
    }
    isHealthy() {
        return this.healthy;
    }
    async get(key) {
        if (!this.client)
            return null;
        return this.client.get(key);
    }
    async set(key, value, ttlSeconds) {
        if (!this.client)
            return;
        if (ttlSeconds) {
            await this.client.setex(key, ttlSeconds, value);
        }
        else {
            await this.client.set(key, value);
        }
    }
    async del(key) {
        if (!this.client)
            return;
        await this.client.del(key);
    }
    async ping() {
        if (!this.client)
            return false;
        try {
            const result = await this.client.ping();
            return result === 'PONG';
        }
        catch {
            return false;
        }
    }
};
exports.RedisService = RedisService;
exports.RedisService = RedisService = RedisService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RedisService);
//# sourceMappingURL=redis.service.js.map