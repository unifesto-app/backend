"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_module_1 = require("../prisma/prisma.module");
const auth_module_1 = require("../auth/auth.module");
const storage_module_1 = require("../storage/storage.module");
const chat_controller_1 = require("./chat.controller");
const chat_gateway_1 = require("./chat.gateway");
const chat_service_1 = require("./chat.service");
const chat_encryption_service_1 = require("./chat-encryption.service");
const moderation_service_1 = require("./moderation/moderation.service");
const keyword_filter_service_1 = require("./moderation/keyword-filter.service");
const moderation_api_service_1 = require("./moderation/moderation-api.service");
let ChatModule = class ChatModule {
};
exports.ChatModule = ChatModule;
exports.ChatModule = ChatModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            storage_module_1.StorageModule,
        ],
        controllers: [chat_controller_1.ChatController],
        providers: [
            chat_gateway_1.ChatGateway,
            chat_service_1.ChatService,
            chat_encryption_service_1.ChatEncryptionService,
            moderation_service_1.ModerationService,
            keyword_filter_service_1.KeywordFilterService,
            moderation_api_service_1.ModerationApiService,
        ],
        exports: [chat_service_1.ChatService],
    })
], ChatModule);
//# sourceMappingURL=chat.module.js.map