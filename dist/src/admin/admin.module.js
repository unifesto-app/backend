"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminModule = void 0;
const common_1 = require("@nestjs/common");
const admin_controller_1 = require("./admin.controller");
const admin_service_1 = require("./admin.service");
const admin_email_controller_1 = require("./admin-email.controller");
const admin_email_service_1 = require("./admin-email.service");
const admin_scheduler_service_1 = require("./admin-scheduler.service");
const prisma_module_1 = require("../prisma/prisma.module");
const redis_module_1 = require("../redis/redis.module");
const storage_module_1 = require("../storage/storage.module");
const auth_module_1 = require("../auth/auth.module");
const email_module_1 = require("../email/email.module");
let AdminModule = class AdminModule {
};
exports.AdminModule = AdminModule;
exports.AdminModule = AdminModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, redis_module_1.RedisModule, storage_module_1.StorageModule, auth_module_1.AuthModule, email_module_1.EmailModule],
        controllers: [admin_controller_1.AdminController, admin_email_controller_1.AdminEmailController],
        providers: [admin_service_1.AdminService, admin_email_service_1.AdminEmailService, admin_scheduler_service_1.AdminSchedulerService],
        exports: [admin_service_1.AdminService, admin_email_service_1.AdminEmailService],
    })
], AdminModule);
//# sourceMappingURL=admin.module.js.map