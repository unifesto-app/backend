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
exports.WalletTransactionResponseDto = exports.WalletResponseDto = exports.UpdatePartnerDto = exports.CreatePartnerDto = exports.PartnerRedeemDto = exports.UpdateRedeemCodeDto = exports.CreateRedeemCodeDto = exports.AdminGrantCoinsDto = exports.RedeemCodeDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
class RedeemCodeDto {
    code;
}
exports.RedeemCodeDto = RedeemCodeDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'WELCOME2024' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RedeemCodeDto.prototype, "code", void 0);
class AdminGrantCoinsDto {
    userId;
    coins;
    reason;
}
exports.AdminGrantCoinsDto = AdminGrantCoinsDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'user-uuid' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], AdminGrantCoinsDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 100 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], AdminGrantCoinsDto.prototype, "coins", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Event participation reward' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AdminGrantCoinsDto.prototype, "reason", void 0);
class CreateRedeemCodeDto {
    code;
    coins;
    totalUses;
    perUserLimit;
    expiresAt;
    restrictToUsers;
    description;
}
exports.CreateRedeemCodeDto = CreateRedeemCodeDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'WELCOME2024' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRedeemCodeDto.prototype, "code", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 50 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateRedeemCodeDto.prototype, "coins", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 100 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateRedeemCodeDto.prototype, "totalUses", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateRedeemCodeDto.prototype, "perUserLimit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2024-12-31T23:59:59Z' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateRedeemCodeDto.prototype, "expiresAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUUID)('4', { each: true }),
    __metadata("design:type", Array)
], CreateRedeemCodeDto.prototype, "restrictToUsers", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Welcome bonus for new users' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRedeemCodeDto.prototype, "description", void 0);
class UpdateRedeemCodeDto {
    isActive;
    totalUses;
    expiresAt;
}
exports.UpdateRedeemCodeDto = UpdateRedeemCodeDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateRedeemCodeDto.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], UpdateRedeemCodeDto.prototype, "totalUses", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpdateRedeemCodeDto.prototype, "expiresAt", void 0);
class PartnerRedeemDto {
    userId;
    coins;
    partnerTxnId;
    description;
}
exports.PartnerRedeemDto = PartnerRedeemDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'user-uuid' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], PartnerRedeemDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 50 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], PartnerRedeemDto.prototype, "coins", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'partner-txn-123' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PartnerRedeemDto.prototype, "partnerTxnId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Redeemed from partner platform' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PartnerRedeemDto.prototype, "description", void 0);
class CreatePartnerDto {
    name;
    slug;
    description;
    logoUrl;
    websiteUrl;
    maxCoinsPerTxn;
}
exports.CreatePartnerDto = CreatePartnerDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'PartnerCo' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePartnerDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'partnerco' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePartnerDto.prototype, "slug", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Partner description' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePartnerDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'https://logo.url' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePartnerDto.prototype, "logoUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'https://partner.com' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePartnerDto.prototype, "websiteUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 100 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreatePartnerDto.prototype, "maxCoinsPerTxn", void 0);
class UpdatePartnerDto {
    isActive;
    maxCoinsPerTxn;
    description;
}
exports.UpdatePartnerDto = UpdatePartnerDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdatePartnerDto.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], UpdatePartnerDto.prototype, "maxCoinsPerTxn", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdatePartnerDto.prototype, "description", void 0);
class WalletResponseDto {
    id;
    balance;
    totalEarned;
    totalSpent;
    createdAt;
    updatedAt;
}
exports.WalletResponseDto = WalletResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], WalletResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], WalletResponseDto.prototype, "balance", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], WalletResponseDto.prototype, "totalEarned", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], WalletResponseDto.prototype, "totalSpent", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], WalletResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], WalletResponseDto.prototype, "updatedAt", void 0);
class WalletTransactionResponseDto {
    id;
    type;
    source;
    coins;
    balanceBefore;
    balanceAfter;
    description;
    note;
    createdAt;
}
exports.WalletTransactionResponseDto = WalletTransactionResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], WalletTransactionResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.TransactionType }),
    __metadata("design:type", String)
], WalletTransactionResponseDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.CoinSource }),
    __metadata("design:type", String)
], WalletTransactionResponseDto.prototype, "source", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], WalletTransactionResponseDto.prototype, "coins", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], WalletTransactionResponseDto.prototype, "balanceBefore", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], WalletTransactionResponseDto.prototype, "balanceAfter", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], WalletTransactionResponseDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], WalletTransactionResponseDto.prototype, "note", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], WalletTransactionResponseDto.prototype, "createdAt", void 0);
//# sourceMappingURL=index.js.map