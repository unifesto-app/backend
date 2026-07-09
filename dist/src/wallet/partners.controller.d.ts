import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../cache/cache.service';
import { CreatePartnerDto, UpdatePartnerDto } from './dto';
export declare class PartnersController {
    private readonly prisma;
    private readonly cache;
    constructor(prisma: PrismaService, cache: CacheService);
    getAllPartners(page?: number, limit?: number): Promise<{
        data: ({
            _count: {
                transactions: number;
            };
        } & {
            id: string;
            name: string;
            createdAt: Date;
            slug: string;
            description: string | null;
            isActive: boolean;
            updatedAt: Date;
            websiteUrl: string | null;
            logoUrl: string | null;
            maxCoinsPerTxn: number | null;
            apiKey: string;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    createPartner(dto: CreatePartnerDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        slug: string;
        description: string | null;
        isActive: boolean;
        updatedAt: Date;
        websiteUrl: string | null;
        logoUrl: string | null;
        maxCoinsPerTxn: number | null;
        apiKey: string;
    }>;
    updatePartner(id: string, dto: UpdatePartnerDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        slug: string;
        description: string | null;
        isActive: boolean;
        updatedAt: Date;
        websiteUrl: string | null;
        logoUrl: string | null;
        maxCoinsPerTxn: number | null;
        apiKey: string;
    }>;
    regenerateApiKey(id: string): Promise<{
        id: string;
        name: string;
        apiKey: string;
    }>;
}
