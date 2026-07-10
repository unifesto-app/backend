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
exports.ReviewSubSpaceRequestDto = exports.CreateSubSpaceRequestDto = exports.SubSpaceRequestType = void 0;
const class_validator_1 = require("class-validator");
var SubSpaceRequestType;
(function (SubSpaceRequestType) {
    SubSpaceRequestType["JOIN_SUPER"] = "JOIN_SUPER";
    SubSpaceRequestType["CONVERT_AND_JOIN"] = "CONVERT_AND_JOIN";
    SubSpaceRequestType["CONVERT_TO_SUPER"] = "CONVERT_TO_SUPER";
    SubSpaceRequestType["CONVERT_TO_REGULAR"] = "CONVERT_TO_REGULAR";
    SubSpaceRequestType["REMOVE_CHILD"] = "REMOVE_CHILD";
    SubSpaceRequestType["REMOVE_PARENT"] = "REMOVE_PARENT";
})(SubSpaceRequestType || (exports.SubSpaceRequestType = SubSpaceRequestType = {}));
class CreateSubSpaceRequestDto {
    requestType;
    subSpaceId;
    targetSpaceId;
    reason;
}
exports.CreateSubSpaceRequestDto = CreateSubSpaceRequestDto;
__decorate([
    (0, class_validator_1.IsEnum)(SubSpaceRequestType),
    __metadata("design:type", String)
], CreateSubSpaceRequestDto.prototype, "requestType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateSubSpaceRequestDto.prototype, "subSpaceId", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateSubSpaceRequestDto.prototype, "targetSpaceId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], CreateSubSpaceRequestDto.prototype, "reason", void 0);
class ReviewSubSpaceRequestDto {
    status;
    reviewNote;
}
exports.ReviewSubSpaceRequestDto = ReviewSubSpaceRequestDto;
__decorate([
    (0, class_validator_1.IsEnum)(['APPROVED', 'REJECTED']),
    __metadata("design:type", String)
], ReviewSubSpaceRequestDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], ReviewSubSpaceRequestDto.prototype, "reviewNote", void 0);
//# sourceMappingURL=sub-space-request.dto.js.map