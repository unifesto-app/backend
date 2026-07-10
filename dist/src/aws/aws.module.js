"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AwsModule = void 0;
const common_1 = require("@nestjs/common");
const aws_controller_1 = require("./aws.controller");
const aws_service_1 = require("./aws.service");
const prisma_module_1 = require("../prisma/prisma.module");
const redis_module_1 = require("../redis/redis.module");
const config_1 = require("@nestjs/config");
const auth_module_1 = require("../auth/auth.module");
let AwsModule = class AwsModule {
};
exports.AwsModule = AwsModule;
exports.AwsModule = AwsModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, redis_module_1.RedisModule, config_1.ConfigModule, auth_module_1.AuthModule],
        controllers: [aws_controller_1.AwsController],
        providers: [aws_service_1.AwsService],
        exports: [aws_service_1.AwsService],
    })
], AwsModule);
//# sourceMappingURL=aws.module.js.map