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
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetPresignedUrlDto = exports.UploadFileDto = exports.StorageFolder = void 0;
const class_validator_1 = require("class-validator");
var StorageFolder;
(function (StorageFolder) {
    StorageFolder["AVATARS"] = "avatars";
    StorageFolder["SPACE_LOGOS"] = "space-logos";
    StorageFolder["SPACE_BANNERS"] = "space-banners";
})(StorageFolder || (exports.StorageFolder = StorageFolder = {}));
class UploadFileDto {
    folder;
    fileName;
    contentType;
}
exports.UploadFileDto = UploadFileDto;
__decorate([
    (0, class_validator_1.IsEnum)(StorageFolder),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UploadFileDto.prototype, "folder", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UploadFileDto.prototype, "fileName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UploadFileDto.prototype, "contentType", void 0);
class GetPresignedUrlDto {
    folder;
    fileName;
    contentType;
}
exports.GetPresignedUrlDto = GetPresignedUrlDto;
__decorate([
    (0, class_validator_1.IsEnum)(StorageFolder),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], GetPresignedUrlDto.prototype, "folder", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], GetPresignedUrlDto.prototype, "fileName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], GetPresignedUrlDto.prototype, "contentType", void 0);
//# sourceMappingURL=upload-file.dto.js.map