import { CategoriesService } from './categories.service';
export declare class CategoriesController {
    private readonly categoriesService;
    constructor(categoriesService: CategoriesService);
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
    create(body: {
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
    update(id: string, body: any): Promise<{
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
