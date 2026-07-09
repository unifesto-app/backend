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
exports.SubscriptionUsageDto = exports.SubscriptionResponseDto = exports.AdminUpdateSubscriptionDto = exports.VerifyUpgradeDto = exports.UpgradeSubscriptionDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
class UpgradeSubscriptionDto {
    plan;
    billingCycle;
}
exports.UpgradeSubscriptionDto = UpgradeSubscriptionDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.OrgPlan, example: client_1.OrgPlan.GROWTH }),
    (0, class_validator_1.IsEnum)(client_1.OrgPlan),
    __metadata("design:type", String)
], UpgradeSubscriptionDto.prototype, "plan", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.BillingCycle, example: client_1.BillingCycle.MONTHLY }),
    (0, class_validator_1.IsEnum)(client_1.BillingCycle),
    __metadata("design:type", String)
], UpgradeSubscriptionDto.prototype, "billingCycle", void 0);
class VerifyUpgradeDto {
    orderId;
    paymentId;
    signature;
}
exports.VerifyUpgradeDto = VerifyUpgradeDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'order_abc123' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], VerifyUpgradeDto.prototype, "orderId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'pay_xyz789' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], VerifyUpgradeDto.prototype, "paymentId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'signature_hash' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], VerifyUpgradeDto.prototype, "signature", void 0);
class AdminUpdateSubscriptionDto {
    plan;
    reason;
}
exports.AdminUpdateSubscriptionDto = AdminUpdateSubscriptionDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.OrgPlan }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.OrgPlan),
    __metadata("design:type", String)
], AdminUpdateSubscriptionDto.prototype, "plan", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Manual upgrade by admin' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AdminUpdateSubscriptionDto.prototype, "reason", void 0);
class SubscriptionResponseDto {
    id;
    plan;
    billingCycle;
    isActive;
    startedAt;
    expiresAt;
    nextPaymentAt;
    eventsThisMonth;
    usageResetAt;
}
exports.SubscriptionResponseDto = SubscriptionResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], SubscriptionResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.OrgPlan }),
    __metadata("design:type", String)
], SubscriptionResponseDto.prototype, "plan", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.BillingCycle }),
    __metadata("design:type", String)
], SubscriptionResponseDto.prototype, "billingCycle", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], SubscriptionResponseDto.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], SubscriptionResponseDto.prototype, "startedAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Date)
], SubscriptionResponseDto.prototype, "expiresAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Date)
], SubscriptionResponseDto.prototype, "nextPaymentAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], SubscriptionResponseDto.prototype, "eventsThisMonth", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], SubscriptionResponseDto.prototype, "usageResetAt", void 0);
class SubscriptionUsageDto {
    spacesCount;
    eventsThisMonth;
    plan;
    limits;
}
exports.SubscriptionUsageDto = SubscriptionUsageDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], SubscriptionUsageDto.prototype, "spacesCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], SubscriptionUsageDto.prototype, "eventsThisMonth", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], SubscriptionUsageDto.prototype, "plan", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Object)
], SubscriptionUsageDto.prototype, "limits", void 0);
//# sourceMappingURL=index.js.map