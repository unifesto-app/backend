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
exports.UpdateSpaceMemberRoleDto = exports.AddSpaceMemberDto = void 0;
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
const SPACE_MEMBER_ROLES = [
    client_1.RoleCode.ORGANISER,
    client_1.RoleCode.CO_ORGANISER,
    client_1.RoleCode.MEMBER,
    client_1.RoleCode.VOLUNTEER,
];
class AddSpaceMemberDto {
    userId;
    role;
}
exports.AddSpaceMemberDto = AddSpaceMemberDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], AddSpaceMemberDto.prototype, "userId", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.RoleCode),
    __metadata("design:type", Object)
], AddSpaceMemberDto.prototype, "role", void 0);
class UpdateSpaceMemberRoleDto {
    role;
}
exports.UpdateSpaceMemberRoleDto = UpdateSpaceMemberRoleDto;
__decorate([
    (0, class_validator_1.IsEnum)(client_1.RoleCode),
    __metadata("design:type", Object)
], UpdateSpaceMemberRoleDto.prototype, "role", void 0);
//# sourceMappingURL=space-member.dto.js.map