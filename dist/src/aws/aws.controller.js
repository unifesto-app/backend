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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AwsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const aws_service_1 = require("./aws.service");
const dto_1 = require("./dto");
let AwsController = class AwsController {
    awsService;
    constructor(awsService) {
        this.awsService = awsService;
    }
    async getHealth() {
        return this.awsService.getInfrastructureHealth();
    }
    async getOverview() {
        return this.awsService.getOverview();
    }
    async getCompute() {
        return this.awsService.getCompute();
    }
    async getDatabase() {
        return this.awsService.getDatabase();
    }
    async getTableDetails(tableName) {
        return this.awsService.getTableDetails(tableName);
    }
    async getCache() {
        return this.awsService.getCache();
    }
    async getStorage() {
        return this.awsService.getStorage();
    }
    async getSecurity() {
        return this.awsService.getSecurity();
    }
    async getCost() {
        return this.awsService.getCost();
    }
    async getSES() {
        return this.awsService.getSES();
    }
    async listFiles(folder) {
        return this.awsService.listFiles(folder);
    }
    async getFileDetails(folder, fileName) {
        return this.awsService.getFileDetails(folder, fileName);
    }
    async getUploadUrl(dto) {
        return this.awsService.getUploadUrl(dto.folder, dto.fileName, dto.contentType);
    }
    async getDownloadUrl(body) {
        return this.awsService.getDownloadUrl(body.folder, body.fileName);
    }
    async uploadFile(file, folder, fileName) {
        if (!file) {
            throw new common_1.BadRequestException('No file provided');
        }
        const finalFileName = fileName || file.originalname;
        return this.awsService.uploadFile(folder, finalFileName, file.buffer, file.mimetype);
    }
    async renameFile(dto) {
        return this.awsService.renameFile(dto.folder, dto.oldFileName, dto.newFileName);
    }
    async deleteFile(dto) {
        return this.awsService.deleteFile(dto.folder, dto.fileName);
    }
    async deleteFiles(body) {
        if (!body.fileNames || body.fileNames.length === 0) {
            throw new common_1.BadRequestException('No files specified for deletion');
        }
        return this.awsService.deleteFiles(body.folder, body.fileNames);
    }
};
exports.AwsController = AwsController;
__decorate([
    (0, common_1.Get)('health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AwsController.prototype, "getHealth", null);
__decorate([
    (0, common_1.Get)('overview'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AwsController.prototype, "getOverview", null);
__decorate([
    (0, common_1.Get)('compute'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AwsController.prototype, "getCompute", null);
__decorate([
    (0, common_1.Get)('database'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AwsController.prototype, "getDatabase", null);
__decorate([
    (0, common_1.Get)('database/table/:tableName'),
    __param(0, (0, common_1.Param)('tableName')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AwsController.prototype, "getTableDetails", null);
__decorate([
    (0, common_1.Get)('cache'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AwsController.prototype, "getCache", null);
__decorate([
    (0, common_1.Get)('storage'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AwsController.prototype, "getStorage", null);
__decorate([
    (0, common_1.Get)('security'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AwsController.prototype, "getSecurity", null);
__decorate([
    (0, common_1.Get)('cost'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AwsController.prototype, "getCost", null);
__decorate([
    (0, common_1.Get)('ses'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AwsController.prototype, "getSES", null);
__decorate([
    (0, common_1.Get)('storage/folders/:folder/files'),
    __param(0, (0, common_1.Param)('folder')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AwsController.prototype, "listFiles", null);
__decorate([
    (0, common_1.Get)('storage/folders/:folder/files/:fileName'),
    __param(0, (0, common_1.Param)('folder')),
    __param(1, (0, common_1.Param)('fileName')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AwsController.prototype, "getFileDetails", null);
__decorate([
    (0, common_1.Post)('storage/upload-url'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.GetPresignedUrlDto]),
    __metadata("design:returntype", Promise)
], AwsController.prototype, "getUploadUrl", null);
__decorate([
    (0, common_1.Post)('storage/download-url'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AwsController.prototype, "getDownloadUrl", null);
__decorate([
    (0, common_1.Post)('storage/upload'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)('folder')),
    __param(2, (0, common_1.Body)('fileName')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], AwsController.prototype, "uploadFile", null);
__decorate([
    (0, common_1.Post)('storage/rename'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.RenameFileDto]),
    __metadata("design:returntype", Promise)
], AwsController.prototype, "renameFile", null);
__decorate([
    (0, common_1.Delete)('storage/delete'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.DeleteFileDto]),
    __metadata("design:returntype", Promise)
], AwsController.prototype, "deleteFile", null);
__decorate([
    (0, common_1.Delete)('storage/delete-multiple'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AwsController.prototype, "deleteFiles", null);
exports.AwsController = AwsController = __decorate([
    (0, common_1.Controller)('aws'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __metadata("design:paramtypes", [aws_service_1.AwsService])
], AwsController);
//# sourceMappingURL=aws.controller.js.map