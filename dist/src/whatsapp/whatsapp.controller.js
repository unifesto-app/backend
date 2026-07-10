"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var WhatsAppController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppController = void 0;
const common_1 = require("@nestjs/common");
const whatsapp_service_1 = require("./whatsapp.service");
let WhatsAppController = WhatsAppController_1 = class WhatsAppController {
    whatsappService;
    logger = new common_1.Logger(WhatsAppController_1.name);
    constructor(whatsappService) {
        this.whatsappService = whatsappService;
    }
    verify(mode, token, challenge, res) {
        const result = this.whatsappService.verifyWebhookChallenge(mode, token, challenge);
        if (result === null) {
            res.status(403).send('Forbidden');
            return;
        }
        res.status(200).send(result);
    }
    receive(signature, req) {
        const rawBody = req.rawBody?.toString('utf8') ?? '';
        if (!signature || !rawBody) {
            throw new common_1.BadRequestException('Missing signature or body');
        }
        const valid = this.whatsappService.verifyWebhookSignature(signature, rawBody);
        if (!valid) {
            this.logger.warn('Rejected WhatsApp webhook with invalid signature');
            throw new common_1.BadRequestException('Invalid signature');
        }
        this.whatsappService.handleWebhookPayload(req.body);
        return { received: true };
    }
};
exports.WhatsAppController = WhatsAppController;
__decorate([
    (0, common_1.Get)('webhook'),
    __param(0, (0, common_1.Query)('hub.mode')),
    __param(1, (0, common_1.Query)('hub.verify_token')),
    __param(2, (0, common_1.Query)('hub.challenge')),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", void 0)
], WhatsAppController.prototype, "verify", null);
__decorate([
    (0, common_1.Post)('webhook'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Headers)('x-hub-signature-256')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Object)
], WhatsAppController.prototype, "receive", null);
exports.WhatsAppController = WhatsAppController = WhatsAppController_1 = __decorate([
    (0, common_1.Controller)('messages'),
    __metadata("design:paramtypes", [whatsapp_service_1.WhatsAppService])
], WhatsAppController);
//# sourceMappingURL=whatsapp.controller.js.map