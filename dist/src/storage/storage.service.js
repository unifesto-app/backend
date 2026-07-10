"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var StorageService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_s3_1 = require("@aws-sdk/client-s3");
let StorageService = StorageService_1 = class StorageService {
    configService;
    logger = new common_1.Logger(StorageService_1.name);
    s3Client;
    bucketName;
    region;
    constructor(configService) {
        this.configService = configService;
        this.region = this.configService.get('AWS_REGION') || '';
        this.bucketName = this.configService.get('S3_BUCKET_NAME') || '';
        this.s3Client = new client_s3_1.S3Client({
            region: this.region,
        });
    }
    onModuleInit() {
        this.logger.log(`StorageService initialized with bucket: ${this.bucketName}, region: ${this.region}`);
    }
    async uploadFile(file, prefix, identifier) {
        try {
            const timestamp = Date.now();
            const extension = file.originalname.split('.').pop();
            const key = `${prefix}${identifier}-${timestamp}.${extension}`;
            this.logger.log(`Uploading file to S3: bucket=${this.bucketName}, key=${key}, size=${file.size}, mimeType=${file.mimetype}`);
            const command = new client_s3_1.PutObjectCommand({
                Bucket: this.bucketName,
                Key: key,
                Body: file.buffer,
                ContentType: file.mimetype,
            });
            await this.s3Client.send(command);
            const s3Url = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
            this.logger.log(`Successfully uploaded file to S3: ${s3Url}`);
            return s3Url;
        }
        catch (error) {
            this.logger.error('S3 upload failed', {
                bucket: this.bucketName,
                prefix,
                identifier,
                fileSize: file.size,
                mimeType: file.mimetype,
                error: error.message,
            });
            throw new common_1.ConflictException(`Failed to upload file: ${error.message || 'S3 error'}`);
        }
    }
};
exports.StorageService = StorageService;
exports.StorageService = StorageService = StorageService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], StorageService);
//# sourceMappingURL=storage.service.js.map