export interface ApiModerationResult {
    flagged: boolean;
    confidence: number;
    reason?: string;
}
export declare class ModerationApiService {
    private readonly logger;
    private readonly apiKey;
    checkText(text: string): Promise<ApiModerationResult>;
}
