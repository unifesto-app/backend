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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModerationService = void 0;
const common_1 = require("@nestjs/common");
const keyword_filter_service_1 = require("./keyword-filter.service");
const moderation_api_service_1 = require("./moderation-api.service");
const client_1 = require("@prisma/client");
let ModerationService = class ModerationService {
    keywordFilter;
    moderationApi;
    constructor(keywordFilter, moderationApi) {
        this.keywordFilter = keywordFilter;
        this.moderationApi = moderationApi;
    }
    async checkText(text) {
        const keywordResult = this.keywordFilter.check(text);
        if (keywordResult.matched) {
            return {
                blocked: true,
                reason: client_1.ModerationFlagReason.KEYWORD_MATCH,
                matchedTerm: keywordResult.matchedTerm,
            };
        }
        if (this.keywordFilter.isBorderlineCandidate(text)) {
            const apiResult = await this.moderationApi.checkText(text);
            if (apiResult.flagged) {
                return {
                    blocked: true,
                    reason: client_1.ModerationFlagReason.API_FLAGGED,
                    confidence: apiResult.confidence,
                };
            }
        }
        return { blocked: false };
    }
    async checkImage(s3Key) {
        return { blocked: false };
    }
};
exports.ModerationService = ModerationService;
exports.ModerationService = ModerationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [keyword_filter_service_1.KeywordFilterService,
        moderation_api_service_1.ModerationApiService])
], ModerationService);
//# sourceMappingURL=moderation.service.js.map