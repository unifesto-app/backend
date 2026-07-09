"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const auth_controller_1 = require("./auth.controller");
const auth_service_1 = require("./auth.service");
const otp_service_1 = require("./otp.service");
const cognito_jwt_service_1 = require("./cognito-jwt.service");
const prisma_module_1 = require("../prisma/prisma.module");
const email_module_1 = require("../email/email.module");
const whatsapp_module_1 = require("../whatsapp/whatsapp.module");
const jwt_auth_guard_1 = require("./guards/jwt-auth.guard");
const redis_module_1 = require("../redis/redis.module");
const roles_guard_1 = require("./guards/roles.guard");
const cache_module_1 = require("../cache/cache.module");
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        imports: [config_1.ConfigModule, prisma_module_1.PrismaModule, email_module_1.EmailModule, whatsapp_module_1.WhatsAppModule, redis_module_1.RedisModule, cache_module_1.CacheModule],
        controllers: [auth_controller_1.AuthController],
        providers: [auth_service_1.AuthService, otp_service_1.OtpService, cognito_jwt_service_1.CognitoJwtService, jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard],
        exports: [auth_service_1.AuthService, cognito_jwt_service_1.CognitoJwtService, jwt_auth_guard_1.JwtAuthGuard],
    })
], AuthModule);
//# sourceMappingURL=auth.module.js.map