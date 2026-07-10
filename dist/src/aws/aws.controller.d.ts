import { AwsService } from './aws.service';
import { GetPresignedUrlDto, RenameFileDto, DeleteFileDto, StorageFolder } from './dto';
export declare class AwsController {
    private readonly awsService;
    constructor(awsService: AwsService);
    getHealth(): Promise<{
        timestamp: string;
        overall: string;
        services: {
            database: {
                status: string;
                latencyMs: number;
                message: string;
            } | {
                status: string;
                latencyMs: null;
                message: any;
            };
            redis: {
                status: string;
                latencyMs: number;
                message: string;
            } | {
                status: string;
                latencyMs: null;
                message: any;
            };
            s3: {
                status: string;
                message: any;
            };
            app: {
                status: string;
                uptime: number;
                memoryUsageMB: number;
                message: string;
            };
        };
    }>;
    getOverview(): Promise<{
        region: string;
        services: {
            ec2: {
                instanceId: string | undefined;
                instanceType: import("@aws-sdk/client-ec2")._InstanceType | undefined;
                state: import("@aws-sdk/client-ec2").InstanceStateName | undefined;
                publicIp: string | undefined;
                launchTime: Date | undefined;
            } | {
                instanceId: string;
                instanceType: string;
                state: string;
                publicIp: null;
                launchTime: null;
            } | {
                error: string;
            };
            rds: {
                identifier: string | undefined;
                status: string | undefined;
                instanceClass: string | undefined;
                engine: string | undefined;
                storageGB: number | undefined;
            } | {
                error: string;
            };
            elasticache: {
                clusterId: string | undefined;
                status: string | undefined;
                nodeType: string | undefined;
                engine: string | undefined;
            } | {
                error: string;
            };
            s3: {
                bucketName: string;
                region: string;
            } | {
                error: string;
            };
        };
    }>;
    getCompute(): Promise<{
        ec2: {
            privateIp: string | undefined;
            availabilityZone: string | undefined;
            platform: string;
            cpu: {
                utilizationPercent: number;
            };
            memory: {
                usedMB: number;
                totalMB: number;
                usedPercent: number;
            };
            disk: {
                totalGB: number;
                usedGB: number;
                usedPercent: number;
            };
            instanceId: string | undefined;
            instanceType: import("@aws-sdk/client-ec2")._InstanceType | undefined;
            state: import("@aws-sdk/client-ec2").InstanceStateName | undefined;
            publicIp: string | undefined;
            launchTime: Date | undefined;
        } | {
            privateIp: string | undefined;
            availabilityZone: string | undefined;
            platform: string;
            cpu: {
                utilizationPercent: number;
            };
            memory: {
                usedMB: number;
                totalMB: number;
                usedPercent: number;
            };
            disk: {
                totalGB: number;
                usedGB: number;
                usedPercent: number;
            };
            instanceId: string;
            instanceType: string;
            state: string;
            publicIp: null;
            launchTime: null;
        };
        pm2: any;
    }>;
    getDatabase(): Promise<{
        rds: {
            identifier: string | undefined;
            status: string | undefined;
            instanceClass: string | undefined;
            engine: string | undefined;
            engineVersion: string | undefined;
            storageGB: number | undefined;
            storageType: string | undefined;
            multiAZ: boolean | undefined;
            backupRetention: number | undefined;
            endpoint: string | undefined;
            port: number | undefined;
            metrics: {
                cpuPercent: number;
                connectionCount: number;
                freeStorageGB: number;
                readLatencyMs: number;
                writeLatencyMs: number;
            };
        };
        tables: {
            name: string;
            rowCount: number;
            sizeMB: number;
        }[];
        migrations: any;
    }>;
    getTableDetails(tableName: string): Promise<{
        tableName: string;
        schema: any;
        rows: unknown;
        stats: {
            rowCount: number;
            sizeMB: number;
        };
    }>;
    getCache(): Promise<{
        elasticache: {
            clusterId: string;
            status: string;
            nodeType: string;
            engine: string;
            engineVersion: string;
            endpoint: string | null;
            port: number;
            tls: boolean;
        };
        redis: {
            connected: boolean;
            info: null;
        } | {
            connected: boolean;
            info: {
                usedMemoryMB: number;
                maxMemoryMB: number;
                usedMemoryPercent: number;
                connectedClients: number;
                totalKeysCount: number;
                hitRate: number;
                uptimeSeconds: number;
            };
        };
        otpStore: {
            activeCount: number;
            keys: string[];
        };
    }>;
    getStorage(): Promise<{
        bucket: {
            name: string;
            region: string;
            versioning: boolean;
            publicAccess: boolean;
        };
        stats: {
            totalObjects: number;
            totalSizeMB: number;
        };
        folders: {
            prefix: string | undefined;
            objectCount: number;
            sizeMB: number;
            recentFiles: {
                key: string | undefined;
                size: number | undefined;
                lastModified: Date | undefined;
                url: string;
            }[];
        }[];
    }>;
    getSecurity(): Promise<{
        iamRole: {
            name: string | undefined;
            arn: string | undefined;
            createDate: Date | undefined;
            attachedPolicies: {
                name: string | undefined;
                arn: string | undefined;
            }[];
            lastUsed: null;
        } | {
            name: string;
            arn: null;
            createDate: null;
            attachedPolicies: never[];
            lastUsed: null;
        };
        securityGroups: {
            id: string | undefined;
            name: string | undefined;
            description: string | undefined;
            inboundRules: {
                type: string;
                port: string | number | undefined;
                protocol: string | undefined;
                source: string;
            }[];
            outboundRules: {
                type: string;
                port: string | number | undefined;
                protocol: string | undefined;
                destination: string;
            }[];
        }[];
    }>;
    getCost(): Promise<{
        currentMonthCost: number;
        forecastedCost: number;
        projectedMonthEndCost: number;
        currency: string;
        billingPeriod: {
            start: string;
            end: string;
            current: string;
        };
        serviceBreakdown: {
            service: string;
            cost: number;
            percentage: number;
        }[];
        error?: undefined;
    } | {
        currentMonthCost: number;
        forecastedCost: number;
        projectedMonthEndCost: number;
        currency: string;
        billingPeriod: {
            start: string;
            end: string;
            current: string;
        };
        serviceBreakdown: {
            service: string;
            cost: number;
            percentage: number;
        }[];
        error: string;
    }>;
    getSES(): Promise<{
        config: {};
        identities: {
            identity: string | undefined;
            type: import("@aws-sdk/client-sesv2").IdentityType | undefined;
            verificationStatus: string;
        }[];
        quota: {};
        stats: {};
        recentActivity: never[];
    }>;
    listFiles(folder: StorageFolder): Promise<{
        folder: string;
        count: number;
        totalSizeMB: number;
        files: {
            key: string | undefined;
            fileName: string | undefined;
            size: number;
            sizeKB: number;
            sizeMB: number;
            lastModified: Date | undefined;
            eTag: string | undefined;
        }[];
    }>;
    getFileDetails(folder: StorageFolder, fileName: string): Promise<{
        key: string;
        fileName: string;
        size: number;
        sizeKB: number;
        sizeMB: number;
        contentType: string | undefined;
        lastModified: Date | undefined;
        eTag: string | undefined;
        downloadUrl: string;
        downloadUrlExpiresIn: number;
    }>;
    getUploadUrl(dto: GetPresignedUrlDto): Promise<{
        uploadUrl: string;
        key: string;
        fileName: string;
        expiresIn: number;
        method: string;
    }>;
    getDownloadUrl(body: {
        folder: StorageFolder;
        fileName: string;
    }): Promise<{
        downloadUrl: string;
        key: string;
        fileName: string;
        expiresIn: number;
    }>;
    uploadFile(file: Express.Multer.File, folder: StorageFolder, fileName?: string): Promise<{
        success: boolean;
        message: string;
        key: string;
        size: number;
        sizeKB: number;
        sizeMB: number;
    }>;
    renameFile(dto: RenameFileDto): Promise<{
        success: boolean;
        message: string;
        oldKey: string;
        newKey: string;
    }>;
    deleteFile(dto: DeleteFileDto): Promise<{
        success: boolean;
        message: string;
        key: string;
    }>;
    deleteFiles(body: {
        folder: StorageFolder;
        fileNames: string[];
    }): Promise<{
        success: boolean;
        deleted: number;
        errors: number;
        deletedFiles: (string | undefined)[] | undefined;
        failedFiles: {
            file: string | undefined;
            code: string | undefined;
            message: string | undefined;
        }[] | undefined;
    }>;
}
