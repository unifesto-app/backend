export declare class RegisterForEventDto {
    ticketTypeId?: string;
    quantity?: number;
    coinsToUse?: number;
    formResponses?: Record<string, any>;
}
export declare class CreateOrderDto {
    ticketTypeId: string;
    quantity: number;
    coinsToUse?: number;
    formResponses?: Record<string, any>;
}
export declare class VerifyPaymentDto {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    registrationId: string;
}
export declare class VerifyRegistrationDto {
    orderId: string;
    paymentId: string;
    signature: string;
}
export declare class OrderResponseDto {
    registrationId: string;
    razorpayOrderId: string | null;
    razorpayKeyId: string | null;
    amount: number;
    currency: string;
    breakdown: {
        baseAmount: number;
        processingFee: number;
        coinsUsed: number;
        coinValueINR: number;
        razorpayAmount: number;
        totalAmount: number;
    };
}
export declare class RegistrationResponseDto {
    registrationId: string;
    message: string;
    qrCode?: string;
    tickets?: any[];
}
