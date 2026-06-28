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
exports.RegistrationResponseDto = exports.OrderResponseDto = exports.VerifyRegistrationDto = exports.VerifyPaymentDto = exports.CreateOrderDto = exports.RegisterForEventDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class RegisterForEventDto {
    ticketTypeId;
    quantity;
    coinsToUse;
    formResponses;
}
exports.RegisterForEventDto = RegisterForEventDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'ticket-type-uuid' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], RegisterForEventDto.prototype, "ticketTypeId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(10),
    __metadata("design:type", Number)
], RegisterForEventDto.prototype, "quantity", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 0 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], RegisterForEventDto.prototype, "coinsToUse", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: { dietaryPreference: 'Vegetarian' } }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], RegisterForEventDto.prototype, "formResponses", void 0);
class CreateOrderDto {
    ticketTypeId;
    quantity;
    coinsToUse;
    formResponses;
}
exports.CreateOrderDto = CreateOrderDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'ticket-type-uuid' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateOrderDto.prototype, "ticketTypeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(10),
    __metadata("design:type", Number)
], CreateOrderDto.prototype, "quantity", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 0 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateOrderDto.prototype, "coinsToUse", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: { dietaryPreference: 'Vegetarian' } }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateOrderDto.prototype, "formResponses", void 0);
class VerifyPaymentDto {
    razorpayOrderId;
    razorpayPaymentId;
    razorpaySignature;
    registrationId;
}
exports.VerifyPaymentDto = VerifyPaymentDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'order_abc123' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], VerifyPaymentDto.prototype, "razorpayOrderId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'pay_xyz789' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], VerifyPaymentDto.prototype, "razorpayPaymentId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'signature_hash' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], VerifyPaymentDto.prototype, "razorpaySignature", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'registration-uuid' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], VerifyPaymentDto.prototype, "registrationId", void 0);
class VerifyRegistrationDto {
    orderId;
    paymentId;
    signature;
}
exports.VerifyRegistrationDto = VerifyRegistrationDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'order_abc123' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], VerifyRegistrationDto.prototype, "orderId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'pay_xyz789' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], VerifyRegistrationDto.prototype, "paymentId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'signature_hash' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], VerifyRegistrationDto.prototype, "signature", void 0);
class OrderResponseDto {
    registrationId;
    razorpayOrderId;
    razorpayKeyId;
    amount;
    currency;
    breakdown;
}
exports.OrderResponseDto = OrderResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], OrderResponseDto.prototype, "registrationId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], OrderResponseDto.prototype, "razorpayOrderId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], OrderResponseDto.prototype, "razorpayKeyId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], OrderResponseDto.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], OrderResponseDto.prototype, "currency", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Object)
], OrderResponseDto.prototype, "breakdown", void 0);
class RegistrationResponseDto {
    registrationId;
    message;
    qrCode;
    tickets;
}
exports.RegistrationResponseDto = RegistrationResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], RegistrationResponseDto.prototype, "registrationId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], RegistrationResponseDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], RegistrationResponseDto.prototype, "qrCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Array)
], RegistrationResponseDto.prototype, "tickets", void 0);
//# sourceMappingURL=index.js.map