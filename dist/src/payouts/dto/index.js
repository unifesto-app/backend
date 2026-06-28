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
exports.UpdateBankAccountStatusDto = exports.CreatePayoutDto = exports.AddBankAccountDto = void 0;
const class_validator_1 = require("class-validator");
class AddBankAccountDto {
    accountHolderName;
    accountNumber;
    ifscCode;
    bankName;
    accountType;
    upiId;
    isPrimary;
}
exports.AddBankAccountDto = AddBankAccountDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AddBankAccountDto.prototype, "accountHolderName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AddBankAccountDto.prototype, "accountNumber", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AddBankAccountDto.prototype, "ifscCode", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AddBankAccountDto.prototype, "bankName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['savings', 'current']),
    __metadata("design:type", String)
], AddBankAccountDto.prototype, "accountType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AddBankAccountDto.prototype, "upiId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], AddBankAccountDto.prototype, "isPrimary", void 0);
class CreatePayoutDto {
    eventId;
    bankAccountId;
    type;
    platformFeePercent;
    notes;
}
exports.CreatePayoutDto = CreatePayoutDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreatePayoutDto.prototype, "eventId", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreatePayoutDto.prototype, "bankAccountId", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(['T2', 'INSTANT']),
    __metadata("design:type", String)
], CreatePayoutDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], CreatePayoutDto.prototype, "platformFeePercent", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePayoutDto.prototype, "notes", void 0);
class UpdateBankAccountStatusDto {
    status;
    rejectionReason;
}
exports.UpdateBankAccountStatusDto = UpdateBankAccountStatusDto;
__decorate([
    (0, class_validator_1.IsEnum)(['VERIFIED', 'REJECTED']),
    __metadata("design:type", String)
], UpdateBankAccountStatusDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateBankAccountStatusDto.prototype, "rejectionReason", void 0);
//# sourceMappingURL=index.js.map