export interface KeywordMatchResult {
    matched: boolean;
    matchedTerm?: string;
}
export declare class KeywordFilterService {
    private readonly matcher;
    check(text: string): KeywordMatchResult;
    isBorderlineCandidate(text: string): boolean;
}
