"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventsModule = void 0;
const auth_module_1 = require("../auth/auth.module");
const common_1 = require("@nestjs/common");
const events_service_1 = require("./events.service");
const events_controller_1 = require("./events.controller");
const event_scheduler_service_1 = require("./event-scheduler.service");
const prisma_module_1 = require("../prisma/prisma.module");
const storage_module_1 = require("../storage/storage.module");
const subscription_module_1 = require("../subscription/subscription.module");
const cache_module_1 = require("../cache/cache.module");
const email_module_1 = require("../email/email.module");
const whatsapp_module_1 = require("../whatsapp/whatsapp.module");
let EventsModule = class EventsModule {
};
exports.EventsModule = EventsModule;
exports.EventsModule = EventsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            auth_module_1.AuthModule,
            prisma_module_1.PrismaModule,
            storage_module_1.StorageModule,
            subscription_module_1.SubscriptionModule,
            cache_module_1.CacheModule,
            email_module_1.EmailModule,
            whatsapp_module_1.WhatsAppModule,
        ],
        controllers: [events_controller_1.EventsController],
        providers: [events_service_1.EventsService, event_scheduler_service_1.EventSchedulerService],
        exports: [events_service_1.EventsService],
    })
], EventsModule);
//# sourceMappingURL=events.module.js.map