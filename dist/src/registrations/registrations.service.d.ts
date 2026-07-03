import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { EmailService } from '../email/email.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { CacheService } from '../cache/cache.service';
import { ChatService } from '../chat/chat.service';
import { Prisma } from '@prisma/client';
import { RegisterForEventDto, CreateOrderDto, VerifyPaymentDto, OrderResponseDto, RegistrationResponseDto } from './dto';
export declare class RegistrationsService {
    private readonly prisma;
    private readonly walletService;
    private readonly emailService;
    private readonly whatsappService;
    private readonly cache;
    private readonly chatService;
    private readonly logger;
    private razorpay;
    constructor(prisma: PrismaService, walletService: WalletService, emailService: EmailService, whatsappService: WhatsAppService, cache: CacheService, chatService: ChatService);
    private generateQRCode;
    private generateTicketCode;
    private formatEventDate;
    private formatEventTime;
    registerForEvent(userId: string, eventId: string, dto: RegisterForEventDto): Promise<{
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
    private sendRegistrationConfirmations;
    completeRSVP(userId: string, eventId: string, dto: RegisterForEventDto, event: any): Promise<{
        registrationId: string;
        message: string;
        qrCode: string;
    }>;
    addToWaitlist(userId: string, eventId: string, dto: RegisterForEventDto): Promise<{
        registrationId: string;
        isWaitlisted: boolean;
        message: string;
    }>;
    createRazorpayOrder(userId: string, registrationId: string): Promise<{
        orderId: string;
        amount: number;
        currency: string;
    }>;
    getMyRegistration(userId: string, eventId: string): Promise<{
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
            price: Prisma.Decimal;
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
        totalAmount: Prisma.Decimal;
        paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
        quantity: number;
        coinsUsed: number;
        coinValueINR: Prisma.Decimal;
        razorpayAmount: Prisma.Decimal;
        processingFee: Prisma.Decimal;
        eventId: string;
        ticketTypeId: string | null;
        paymentId: string | null;
        orderId: string | null;
        paidAt: Date | null;
        isWaitlisted: boolean;
        qrCode: string;
        checkedInAt: Date | null;
        checkedInBy: string | null;
        formResponses: Prisma.JsonValue | null;
        registeredAt: Date;
    }>;
    getMyRegistrationsForEvent(userId: string, eventId: string): Promise<({
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
            price: Prisma.Decimal;
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
        totalAmount: Prisma.Decimal;
        paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
        quantity: number;
        coinsUsed: number;
        coinValueINR: Prisma.Decimal;
        razorpayAmount: Prisma.Decimal;
        processingFee: Prisma.Decimal;
        eventId: string;
        ticketTypeId: string | null;
        paymentId: string | null;
        orderId: string | null;
        paidAt: Date | null;
        isWaitlisted: boolean;
        qrCode: string;
        checkedInAt: Date | null;
        checkedInBy: string | null;
        formResponses: Prisma.JsonValue | null;
        registeredAt: Date;
    })[]>;
    getEventRegistrations(userId: string, eventId: string, page?: number, limit?: number): Promise<{
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
                price: Prisma.Decimal;
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
            totalAmount: Prisma.Decimal;
            paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
            quantity: number;
            coinsUsed: number;
            coinValueINR: Prisma.Decimal;
            razorpayAmount: Prisma.Decimal;
            processingFee: Prisma.Decimal;
            eventId: string;
            ticketTypeId: string | null;
            paymentId: string | null;
            orderId: string | null;
            paidAt: Date | null;
            isWaitlisted: boolean;
            qrCode: string;
            checkedInAt: Date | null;
            checkedInBy: string | null;
            formResponses: Prisma.JsonValue | null;
            registeredAt: Date;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    exportRegistrations(userId: string, eventId: string): Promise<{
        csv: string;
        filename: string;
    }>;
    getMyRegistrations(userId: string, page?: number, limit?: number): Promise<{
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
                price: Prisma.Decimal;
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
            totalAmount: Prisma.Decimal;
            paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
            quantity: number;
            coinsUsed: number;
            coinValueINR: Prisma.Decimal;
            razorpayAmount: Prisma.Decimal;
            processingFee: Prisma.Decimal;
            eventId: string;
            ticketTypeId: string | null;
            paymentId: string | null;
            orderId: string | null;
            paidAt: Date | null;
            isWaitlisted: boolean;
            qrCode: string;
            checkedInAt: Date | null;
            checkedInBy: string | null;
            formResponses: Prisma.JsonValue | null;
            registeredAt: Date;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    createPaymentOrder(eventId: string, userId: string, dto: CreateOrderDto): Promise<OrderResponseDto>;
    verifyPayment(eventId: string, userId: string, dto: VerifyPaymentDto): Promise<RegistrationResponseDto>;
    handleRazorpayWebhook(payload: any, signature: string): Promise<{
        received: boolean;
    }>;
    private completeWebhookPayment;
    cancelRegistration(eventId: string, userId: string, ticketTypeId?: string | null): Promise<any>;
}
