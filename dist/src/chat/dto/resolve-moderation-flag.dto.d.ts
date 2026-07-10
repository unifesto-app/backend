import { ModerationActionType } from '@prisma/client';
export declare class ResolveModerationFlagDto {
    actionType: ModerationActionType;
    notes?: string;
}
