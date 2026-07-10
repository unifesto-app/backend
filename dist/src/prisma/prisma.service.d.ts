import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
export declare class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    private readonly logger;
    constructor();
    onModuleInit(): Promise<void>;
    private maskDatabaseUrl;
    onModuleDestroy(): Promise<void>;
    cleanDatabase(): Promise<any[]>;
    enableShutdownHooks(app: any): Promise<void>;
}
