"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ModerationApiService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModerationApiService = void 0;
const common_1 = require("@nestjs/common");
let ModerationApiService = ModerationApiService_1 = class ModerationApiService {
    logger = new common_1.Logger(ModerationApiService_1.name);
    apiKey = process.env.OPENAI_API_KEY;
    async checkText(text) {
        if (!this.apiKey) {
            this.logger.warn('OPENAI_API_KEY not set — skipping API moderation check.');
            return { flagged: false, confidence: 0 };
        }
        try {
            const response = await fetch('https://api.openai.com/v1/moderations', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ input: text }),
            });
            if (!response.ok) {
                throw new Error(`OpenAI moderation API returned ${response.status}`);
            }
            const data = await response.json();
            const result = data.results?.[0];
            if (!result) {
                return { flagged: false, confidence: 0 };
            }
            const sexualScore = result.category_scores?.sexual ?? 0;
            const sexualMinorsFlag = result.categories?.['sexual/minors'] ?? false;
            const sexualFlag = result.categories?.sexual ?? false;
            if (sexualMinorsFlag) {
                return { flagged: true, confidence: 1, reason: 'sexual/minors' };
            }
            if (sexualFlag) {
                return { flagged: true, confidence: sexualScore, reason: 'sexual' };
            }
            return { flagged: false, confidence: sexualScore };
        }
        catch (err) {
            this.logger.error(`Moderation API check failed: ${err.message}`);
            return { flagged: false, confidence: 0 };
        }
    }
};
exports.ModerationApiService = ModerationApiService;
exports.ModerationApiService = ModerationApiService = ModerationApiService_1 = __decorate([
    (0, common_1.Injectable)()
], ModerationApiService);
//# sourceMappingURL=moderation-api.service.js.map