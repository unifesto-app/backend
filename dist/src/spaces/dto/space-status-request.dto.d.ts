export declare class CreateSpaceStatusRequestDto {
    spaceId: string;
    requestedStatus: string;
    reason: string;
}
export declare class ReviewSpaceStatusRequestDto {
    status: string;
    reviewNote?: string;
}
