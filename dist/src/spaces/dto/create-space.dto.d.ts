import { SpaceVisibility } from '@prisma/client';
export declare class CreateSpaceDto {
    name: string;
    slug: string;
    description?: string;
    websiteUrl?: string;
    city?: string;
    state?: string;
    country?: string;
    tags?: string[];
    visibility?: SpaceVisibility;
    coOrganiserLimit?: number;
}
