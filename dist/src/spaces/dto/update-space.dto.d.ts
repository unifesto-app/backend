import { CreateSpaceDto } from './create-space.dto';
import { SpaceStatus } from '@prisma/client';
declare const UpdateSpaceDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateSpaceDto>>;
export declare class UpdateSpaceDto extends UpdateSpaceDto_base {
    parentSpaceId?: string | null;
}
export declare class UpdateSpaceStatusDto {
    status: SpaceStatus;
    rejectionReason?: string;
}
export {};
