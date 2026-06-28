import { PrismaService } from '../prisma/prisma.service';
export declare class CategoriesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getAll(): Promise<{
        event_count: number;
        id: string;
        name: string;
        slug: string;
        description: string | null;
        iconUrl: string | null;
        color: string | null;
        order: number;
    }[]>;
    create(data: {
        name: string;
        description?: string;
        color?: string;
        iconUrl?: string;
    }): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        slug: string;
        description: string | null;
        iconUrl: string | null;
        color: string | null;
        isActive: boolean;
        order: number;
        updatedAt: Date;
    }>;
    update(id: string, data: any): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        slug: string;
        description: string | null;
        iconUrl: string | null;
        color: string | null;
        isActive: boolean;
        order: number;
        updatedAt: Date;
    }>;
    delete(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        slug: string;
        description: string | null;
        iconUrl: string | null;
        color: string | null;
        isActive: boolean;
        order: number;
        updatedAt: Date;
    }>;
}
