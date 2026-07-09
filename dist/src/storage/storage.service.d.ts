import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export declare class StorageService implements OnModuleInit {
    private configService;
    private readonly logger;
    private readonly s3Client;
    private readonly bucketName;
    private readonly region;
    constructor(configService: ConfigService);
    onModuleInit(): void;
    uploadFile(file: Express.Multer.File, prefix: string, identifier: string): Promise<string>;
}
