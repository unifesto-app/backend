"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpacesModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const spaces_controller_1 = require("./spaces.controller");
const spaces_service_1 = require("./spaces.service");
const prisma_module_1 = require("../prisma/prisma.module");
const auth_module_1 = require("../auth/auth.module");
const storage_module_1 = require("../storage/storage.module");
const email_module_1 = require("../email/email.module");
const guards_1 = require("../auth/guards");
let SpacesModule = class SpacesModule {
};
exports.SpacesModule = SpacesModule;
exports.SpacesModule = SpacesModule = __decorate([
    (0, common_1.Module)({
        imports: [config_1.ConfigModule, prisma_module_1.PrismaModule, auth_module_1.AuthModule, storage_module_1.StorageModule, email_module_1.EmailModule],
        controllers: [spaces_controller_1.SpacesController],
        providers: [spaces_service_1.SpacesService, guards_1.RolesGuard],
        exports: [spaces_service_1.SpacesService],
    })
], SpacesModule);
//# sourceMappingURL=spaces.module.js.map