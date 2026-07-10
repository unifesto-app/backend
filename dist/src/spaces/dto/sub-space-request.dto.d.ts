export declare enum SubSpaceRequestType {
    JOIN_SUPER = "JOIN_SUPER",
    CONVERT_AND_JOIN = "CONVERT_AND_JOIN",
    CONVERT_TO_SUPER = "CONVERT_TO_SUPER",
    CONVERT_TO_REGULAR = "CONVERT_TO_REGULAR",
    REMOVE_CHILD = "REMOVE_CHILD",
    REMOVE_PARENT = "REMOVE_PARENT"
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
