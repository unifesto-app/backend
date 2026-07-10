"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionModule = void 0;
const auth_module_1 = require("../auth/auth.module");
const common_1 = require("@nestjs/common");
const subscription_service_1 = require("./subscription.service");
const subscription_controller_1 = require("./subscription.controller");
const subscription_scheduler_service_1 = require("./subscription-scheduler.service");
const prisma_module_1 = require("../prisma/prisma.module");
const cache_module_1 = require("../cache/cache.module");
const email_module_1 = require("../email/email.module");
let SubscriptionModule = class SubscriptionModule {
};
exports.SubscriptionModule = SubscriptionModule;
exports.SubscriptionModule = SubscriptionModule = __decorate([
    (0, common_1.Module)({
        imports: [auth_module_1.AuthModule, prisma_module_1.PrismaModule, cache_module_1.CacheModule, email_module_1.EmailModule],
        controllers: [subscription_controller_1.SubscriptionController],
        providers: [subscription_service_1.SubscriptionService, subscription_scheduler_service_1.SubscriptionSchedulerService],
        exports: [subscription_service_1.SubscriptionService],
    })
], SubscriptionModule);
//# sourceMappingURL=subscription.module.js.map