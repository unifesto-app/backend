import { KeywordFilterService } from './keyword-filter.service';
import { ModerationApiService } from './moderation-api.service';
import { ModerationFlagReason } from '@prisma/client';
export interface ModerationResult {
    blocked: boolean;
    reason?: ModerationFlagReason;
    matchedTerm?: string;
    confidence?: number;
}
export declare class ModerationService {
    private readonly keywordFilter;
    private readonly moderationApi;
    constructor(keywordFilter: KeywordFilterService, moderationApi: ModerationApiService);
    checkText(text: string): Promise<ModerationResult>;
    checkImage(s3Key: string): Promise<ModerationResult>;
}
