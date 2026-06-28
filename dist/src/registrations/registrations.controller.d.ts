import { RegistrationsService } from './registrations.service';
import { RegisterForEventDto, CreateOrderDto, VerifyPaymentDto } from './dto';
export declare class RegistrationsController {
    private readonly registrationsService;
    constructor(registrationsService: RegistrationsService);
    registerForEvent(req: any, id: string, dto: RegisterForEventDto): Promise<{
        registrationId: string;
        isWaitlisted: boolean;
        message: string;
    } | {
        registrationId: string;
        message: string;
        qrCode: string;
    } | {
        registrationId: string;
        needsPayment: boolean;
        razorpayAmount: number;
        coinsUsed: number;
        coinValueINR: number;
        totalAmount: number;
        processingFee: number;
        message?: undefined;
    } | {
        registrationId: string;
        needsPayment: boolean;
        message: string;
        razorpayAmount?: undefined;
        coinsUsed?: undefined;
        coinValueINR?: undefined;
        totalAmount?: undefined;
        processingFee?: undefined;
    }>;
    createPaymentOrder(req: any, eventId: string, dto: CreateOrderDto): Promise<import("./dto").OrderResponseDto>;
    verifyPayment(req: any, eventId: string, dto: VerifyPaymentDto): Promise<import("./dto").RegistrationResponseDto>;
    getMyRegistration(req: any, id: string): Promise<{
        event: {
            id: string;
            slug: string;
            title: string;
            startDateTime: Date;
            endDateTime: Date;
            venueName: string | null;
            city: string | null;
        };
        ticketType: {
            id: string;
            name: string;
            createdAt: Date;
            description: string | null;
            isActive: boolean;
            order: number;
            currency: string;
            eventId: string;
            perUserLimit: number;
            price: import("@prisma/client/runtime/library").Decimal;
            totalQuantity: number;
            saleStartsAt: Date | null;
            saleEndsAt: Date | null;
            isVisible: boolean;
            soldCount: number;
        } | null;
        tickets: {
            id: string;
            createdAt: Date;
            status: import("@prisma/client").$Enums.TicketStatus;
            qrCode: string;
            checkedInAt: Date | null;
            registrationId: string;
            ticketCode: string;
            attendeeName: string | null;
            attendeeEmail: string | null;
        }[];
    } & {
        id: string;
        status: import("@prisma/client").$Enums.RegistrationStatus;
        cancelledAt: Date | null;
        userId: string;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
        quantity: number;
        coinsUsed: number;
        coinValueINR: import("@prisma/client/runtime/library").Decimal;
        razorpayAmount: import("@prisma/client/runtime/library").Decimal;
        processingFee: import("@prisma/client/runtime/library").Decimal;
        eventId: string;
        ticketTypeId: string | null;
        paymentId: string | null;
        orderId: string | null;
        paidAt: Date | null;
        isWaitlisted: boolean;
        qrCode: string;
        checkedInAt: Date | null;
        checkedInBy: string | null;
        formResponses: import("@prisma/client/runtime/library").JsonValue | null;
        registeredAt: Date;
    }>;
    getMyRegistrationsForEvent(req: any, id: string): Promise<({
        event: {
            id: string;
            slug: string;
            title: string;
            startDateTime: Date;
            endDateTime: Date;
            venueName: string | null;
            city: string | null;
        };
        ticketType: {
            id: string;
            name: string;
            createdAt: Date;
            description: string | null;
            isActive: boolean;
            order: number;
            currency: string;
            eventId: string;
            perUserLimit: number;
            price: import("@prisma/client/runtime/library").Decimal;
            totalQuantity: number;
            saleStartsAt: Date | null;
            saleEndsAt: Date | null;
            isVisible: boolean;
            soldCount: number;
        } | null;
        tickets: {
            id: string;
            createdAt: Date;
            status: import("@prisma/client").$Enums.TicketStatus;
            qrCode: string;
            checkedInAt: Date | null;
            registrationId: string;
            ticketCode: string;
            attendeeName: string | null;
            attendeeEmail: string | null;
        }[];
    } & {
        id: string;
        status: import("@prisma/client").$Enums.RegistrationStatus;
        cancelledAt: Date | null;
        userId: string;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
        quantity: number;
        coinsUsed: number;
        coinValueINR: import("@prisma/client/runtime/library").Decimal;
        razorpayAmount: import("@prisma/client/runtime/library").Decimal;
        processingFee: import("@prisma/client/runtime/library").Decimal;
        eventId: string;
        ticketTypeId: string | null;
        paymentId: string | null;
        orderId: string | null;
        paidAt: Date | null;
        isWaitlisted: boolean;
        qrCode: string;
        checkedInAt: Date | null;
        checkedInBy: string | null;
        formResponses: import("@prisma/client/runtime/library").JsonValue | null;
        registeredAt: Date;
    })[]>;
    cancelRegistration(req: any, id: string, ticketTypeId?: string): Promise<any>;
    getEventRegistrations(req: any, id: string, page?: number, limit?: number): Promise<{
        data: ({
            user: {
                id: string;
                mobileNumber: string;
                username: string | null;
                fullName: string | null;
            };
            ticketType: {
                id: string;
                name: string;
                createdAt: Date;
                description: string | null;
                isActive: boolean;
                order: number;
                currency: string;
                eventId: string;
                perUserLimit: number;
                price: import("@prisma/client/runtime/library").Decimal;
                totalQuantity: number;
                saleStartsAt: Date | null;
                saleEndsAt: Date | null;
                isVisible: boolean;
                soldCount: number;
            } | null;
            tickets: {
                id: string;
                createdAt: Date;
                status: import("@prisma/client").$Enums.TicketStatus;
                qrCode: string;
                checkedInAt: Date | null;
                registrationId: string;
                ticketCode: string;
                attendeeName: string | null;
                attendeeEmail: string | null;
            }[];
        } & {
            id: string;
            status: import("@prisma/client").$Enums.RegistrationStatus;
            cancelledAt: Date | null;
            userId: string;
            totalAmount: import("@prisma/client/runtime/library").Decimal;
            paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
            quantity: number;
            coinsUsed: number;
            coinValueINR: import("@prisma/client/runtime/library").Decimal;
            razorpayAmount: import("@prisma/client/runtime/library").Decimal;
            processingFee: import("@prisma/client/runtime/library").Decimal;
            eventId: string;
            ticketTypeId: string | null;
            paymentId: string | null;
            orderId: string | null;
            paidAt: Date | null;
            isWaitlisted: boolean;
            qrCode: string;
            checkedInAt: Date | null;
            checkedInBy: string | null;
            formResponses: import("@prisma/client/runtime/library").JsonValue | null;
            registeredAt: Date;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    exportRegistrations(req: any, id: string): Promise<{
        csv: string;
        filename: string;
    }>;
    getMyRegistrations(req: any, page?: number, limit?: number): Promise<{
        data: ({
            event: {
                id: string;
                slug: string;
                title: string;
                coverImageUrl: string | null;
                type: import("@prisma/client").$Enums.EventType;
                startDateTime: Date;
                endDateTime: Date;
                venueName: string | null;
                city: string | null;
            };
            ticketType: {
                id: string;
                name: string;
                createdAt: Date;
                description: string | null;
                isActive: boolean;
                order: number;
                currency: string;
                eventId: string;
                perUserLimit: number;
                price: import("@prisma/client/runtime/library").Decimal;
                totalQuantity: number;
                saleStartsAt: Date | null;
                saleEndsAt: Date | null;
                isVisible: boolean;
                soldCount: number;
            } | null;
            tickets: {
                id: string;
                createdAt: Date;
                status: import("@prisma/client").$Enums.TicketStatus;
                qrCode: string;
                checkedInAt: Date | null;
                registrationId: string;
                ticketCode: string;
                attendeeName: string | null;
                attendeeEmail: string | null;
            }[];
        } & {
            id: string;
            status: import("@prisma/client").$Enums.RegistrationStatus;
            cancelledAt: Date | null;
            userId: string;
            totalAmount: import("@prisma/client/runtime/library").Decimal;
            paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
            quantity: number;
            coinsUsed: number;
            coinValueINR: import("@prisma/client/runtime/library").Decimal;
            razorpayAmount: import("@prisma/client/runtime/library").Decimal;
            processingFee: import("@prisma/client/runtime/library").Decimal;
            eventId: string;
            ticketTypeId: string | null;
            paymentId: string | null;
            orderId: string | null;
            paidAt: Date | null;
            isWaitlisted: boolean;
            qrCode: string;
            checkedInAt: Date | null;
            checkedInBy: string | null;
            formResponses: import("@prisma/client/runtime/library").JsonValue | null;
            registeredAt: Date;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    handleRazorpayWebhook(signature: string, req: any): Promise<{
        received: boolean;
    }>;
}
