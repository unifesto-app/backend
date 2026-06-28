"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegistrationsModule = void 0;
const auth_module_1 = require("../auth/auth.module");
const common_1 = require("@nestjs/common");
const registrations_service_1 = require("./registrations.service");
const registrations_controller_1 = require("./registrations.controller");
const prisma_module_1 = require("../prisma/prisma.module");
const wallet_module_1 = require("../wallet/wallet.module");
const email_module_1 = require("../email/email.module");
const whatsapp_module_1 = require("../whatsapp/whatsapp.module");
const cache_module_1 = require("../cache/cache.module");
let RegistrationsModule = class RegistrationsModule {
};
exports.RegistrationsModule = RegistrationsModule;
exports.RegistrationsModule = RegistrationsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            auth_module_1.AuthModule,
            prisma_module_1.PrismaModule,
            wallet_module_1.WalletModule,
            email_module_1.EmailModule,
            whatsapp_module_1.WhatsAppModule,
            cache_module_1.CacheModule,
        ],
        controllers: [registrations_controller_1.RegistrationsController],
        providers: [registrations_service_1.RegistrationsService],
        exports: [registrations_service_1.RegistrationsService],
    })
], RegistrationsModule);
//# sourceMappingURL=registrations.module.js.map