"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const schedule_1 = require("@nestjs/schedule");
const throttler_1 = require("@nestjs/throttler");
const throttler_storage_redis_1 = require("@nest-lab/throttler-storage-redis");
const core_1 = require("@nestjs/core");
const categories_module_1 = require("./categories/categories.module");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const config_module_1 = require("./config/config.module");
const prisma_module_1 = require("./prisma/prisma.module");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const roles_module_1 = require("./roles/roles.module");
const spaces_module_1 = require("./spaces/spaces.module");
const discussions_module_1 = require("./discussions/discussions.module");
const storage_module_1 = require("./storage/storage.module");
const redis_module_1 = require("./redis/redis.module");
const redis_service_1 = require("./redis/redis.service");
const admin_module_1 = require("./admin/admin.module");
const aws_module_1 = require("./aws/aws.module");
const subscription_module_1 = require("./subscription/subscription.module");
const wallet_module_1 = require("./wallet/wallet.module");
const referrals_module_1 = require("./referrals/referrals.module");
const events_module_1 = require("./events/events.module");
const registrations_module_1 = require("./registrations/registrations.module");
const checkin_module_1 = require("./checkin/checkin.module");
const payouts_module_1 = require("./payouts/payouts.module");
const chat_module_1 = require("./chat/chat.module");
const whatsapp_module_1 = require("./whatsapp/whatsapp.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            categories_module_1.CategoriesModule,
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env',
            }),
            schedule_1.ScheduleModule.forRoot(),
            throttler_1.ThrottlerModule.forRootAsync({
                imports: [
                    categories_module_1.CategoriesModule, redis_module_1.RedisModule
                ],
                useFactory: (redisService) => {
                    const logger = new common_1.Logger('ThrottlerModule');
                    const redisClient = redisService.getClient();
                    if (redisClient) {
                        logger.log('Throttler using Redis storage backend');
                        return {
                            throttlers: [
                                {
                                    ttl: 60000,
                                    limit: 100,
                                },
                            ],
                            storage: new throttler_storage_redis_1.ThrottlerStorageRedisService(redisClient),
                        };
                    }
                    else {
                        logger.warn('Throttler falling back to in-memory storage - Redis unavailable');
                        return {
                            throttlers: [
                                {
                                    ttl: 60000,
                                    limit: 100,
                                },
                            ],
                        };
                    }
                },
                inject: [redis_service_1.RedisService],
            }),
            config_module_1.ConfigModule,
            redis_module_1.RedisModule,
            prisma_module_1.PrismaModule,
            storage_module_1.StorageModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            roles_module_1.RolesModule,
            spaces_module_1.SpacesModule,
            discussions_module_1.DiscussionsModule,
            admin_module_1.AdminModule,
            aws_module_1.AwsModule,
            subscription_module_1.SubscriptionModule,
            wallet_module_1.WalletModule,
            referrals_module_1.ReferralsModule,
            events_module_1.EventsModule,
            registrations_module_1.RegistrationsModule,
            checkin_module_1.CheckinModule,
            payouts_module_1.PayoutsModule,
            chat_module_1.ChatModule,
            whatsapp_module_1.WhatsAppModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [
            app_service_1.AppService,
            {
                provide: core_1.APP_GUARD,
                useClass: throttler_1.ThrottlerGuard,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map