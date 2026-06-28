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
exports.GetFileDto = exports.ListFilesDto = exports.DeleteFileDto = exports.RenameFileDto = void 0;
const class_validator_1 = require("class-validator");
const upload_file_dto_1 = require("./upload-file.dto");
class RenameFileDto {
    folder;
    oldFileName;
    newFileName;
}
exports.RenameFileDto = RenameFileDto;
__decorate([
    (0, class_validator_1.IsEnum)(upload_file_dto_1.StorageFolder),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], RenameFileDto.prototype, "folder", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], RenameFileDto.prototype, "oldFileName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], RenameFileDto.prototype, "newFileName", void 0);
class DeleteFileDto {
    folder;
    fileName;
}
exports.DeleteFileDto = DeleteFileDto;
__decorate([
    (0, class_validator_1.IsEnum)(upload_file_dto_1.StorageFolder),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], DeleteFileDto.prototype, "folder", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], DeleteFileDto.prototype, "fileName", void 0);
class ListFilesDto {
    folder;
}
exports.ListFilesDto = ListFilesDto;
__decorate([
    (0, class_validator_1.IsEnum)(upload_file_dto_1.StorageFolder),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ListFilesDto.prototype, "folder", void 0);
class GetFileDto {
    folder;
    fileName;
}
exports.GetFileDto = GetFileDto;
__decorate([
    (0, class_validator_1.IsEnum)(upload_file_dto_1.StorageFolder),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], GetFileDto.prototype, "folder", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], GetFileDto.prototype, "fileName", void 0);
//# sourceMappingURL=file-operation.dto.js.map