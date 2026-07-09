export declare enum SubSpaceRequestType {
    JOIN_SUPER = "JOIN_SUPER",
    CONVERT_AND_JOIN = "CONVERT_AND_JOIN",
    CONVERT_TO_SUPER = "CONVERT_TO_SUPER"
}
export declare class CreateSubSpaceRequestDto {
    requestType: SubSpaceRequestType;
    subSpaceId?: string;
    targetSpaceId: string;
    reason: string;
}
export declare class ReviewSubSpaceRequestDto {
    status: 'APPROVED' | 'REJECTED';
    reviewNote?: string;
}
