"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeywordFilterService = void 0;
const common_1 = require("@nestjs/common");
const obscenity_1 = require("obscenity");
let KeywordFilterService = class KeywordFilterService {
    matcher = new obscenity_1.RegExpMatcher({
        ...obscenity_1.englishDataset.build(),
        ...obscenity_1.englishRecommendedTransformers,
    });
    check(text) {
        const matches = this.matcher.getAllMatches(text);
        if (matches.length === 0) {
            return { matched: false };
        }
        return { matched: true, matchedTerm: `term_id:${matches[0].termId}` };
    }
    isBorderlineCandidate(text) {
        if (text.length < 3)
            return false;
        const suspiciousPatterns = [/\b\d{1,2}\s*(yo|y\/o|years? old)\b/i];
        return suspiciousPatterns.some((p) => p.test(text));
    }
};
exports.KeywordFilterService = KeywordFilterService;
exports.KeywordFilterService = KeywordFilterService = __decorate([
    (0, common_1.Injectable)()
], KeywordFilterService);
//# sourceMappingURL=keyword-filter.service.js.map