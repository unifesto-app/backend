"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckinModule = void 0;
const auth_module_1 = require("../auth/auth.module");
const common_1 = require("@nestjs/common");
const checkin_service_1 = require("./checkin.service");
const checkin_controller_1 = require("./checkin.controller");
const prisma_module_1 = require("../prisma/prisma.module");
const wallet_module_1 = require("../wallet/wallet.module");
const email_module_1 = require("../email/email.module");
const cache_module_1 = require("../cache/cache.module");
let CheckinModule = class CheckinModule {
};
exports.CheckinModule = CheckinModule;
exports.CheckinModule = CheckinModule = __decorate([
    (0, common_1.Module)({
        imports: [auth_module_1.AuthModule, auth_module_1.AuthModule, prisma_module_1.PrismaModule, wallet_module_1.WalletModule, email_module_1.EmailModule, cache_module_1.CacheModule],
        controllers: [checkin_controller_1.CheckinController],
        providers: [checkin_service_1.CheckinService],
        exports: [checkin_service_1.CheckinService],
    })
], CheckinModule);
//# sourceMappingURL=checkin.module.js.map