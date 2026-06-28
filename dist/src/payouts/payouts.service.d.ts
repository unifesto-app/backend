import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { AddBankAccountDto, CreatePayoutDto, UpdateBankAccountStatusDto } from './dto';
export declare class PayoutsService {
    private readonly prisma;
    private readonly emailService;
    private readonly logger;
    private readonly razorpay;
    private readonly DEFAULT_PLATFORM_FEE_PERCENT;
    private readonly INSTANT_SURCHARGE_PERCENT;
    constructor(prisma: PrismaService, emailService: EmailService);
    addBankAccount(userId: string, dto: AddBankAccountDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.BankAccountStatus;
        userId: string;
        isPrimary: boolean;
        rejectionReason: string | null;
        accountHolderName: string;
        accountNumber: string;
        ifscCode: string;
        bankName: string;
        accountType: string;
        upiId: string | null;
        razorpayContactId: string | null;
        razorpayFundAccountId: string | null;
        verifiedAt: Date | null;
        verifiedBy: string | null;
    }>;
    getMyBankAccounts(userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.BankAccountStatus;
        userId: string;
        isPrimary: boolean;
        rejectionReason: string | null;
        accountHolderName: string;
        accountNumber: string;
        ifscCode: string;
        bankName: string;
        accountType: string;
        upiId: string | null;
        razorpayContactId: string | null;
        razorpayFundAccountId: string | null;
        verifiedAt: Date | null;
        verifiedBy: string | null;
    }[]>;
    deleteBankAccount(userId: string, accountId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.BankAccountStatus;
        userId: string;
        isPrimary: boolean;
        rejectionReason: string | null;
        accountHolderName: string;
        accountNumber: string;
        ifscCode: string;
        bankName: string;
        accountType: string;
        upiId: string | null;
        razorpayContactId: string | null;
        razorpayFundAccountId: string | null;
        verifiedAt: Date | null;
        verifiedBy: string | null;
    }>;
    updateBankAccountStatus(accountId: string, dto: UpdateBankAccountStatusDto, adminId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.BankAccountStatus;
        userId: string;
        isPrimary: boolean;
        rejectionReason: string | null;
        accountHolderName: string;
        accountNumber: string;
        ifscCode: string;
        bankName: string;
        accountType: string;
        upiId: string | null;
        razorpayContactId: string | null;
        razorpayFundAccountId: string | null;
        verifiedAt: Date | null;
        verifiedBy: string | null;
    }>;
    private createRazorpayFundAccount;
    getEventPayoutSummary(eventId: string, userId?: string): Promise<{
        eventId: string;
        registrationCount: number;
        grossRevenue: number;
        defaultPlatformFeePercent: number;
        estimatedPlatformFee: number;
        estimatedNetT2: number;
        estimatedNetInstant: number;
        existingPayout: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            type: import("@prisma/client").$Enums.PayoutType;
            status: import("@prisma/client").$Enums.PayoutStatus;
            createdBy: string | null;
            scheduledAt: Date;
            userId: string;
            eventId: string;
            notes: string | null;
            bankAccountId: string;
            platformFeePercent: import("@prisma/client/runtime/library").Decimal;
            grossRevenue: import("@prisma/client/runtime/library").Decimal;
            platformFee: import("@prisma/client/runtime/library").Decimal;
            instantFee: import("@prisma/client/runtime/library").Decimal;
            netAmount: import("@prisma/client/runtime/library").Decimal;
            processedAt: Date | null;
            completedAt: Date | null;
            failedAt: Date | null;
            failureReason: string | null;
            razorpayTransferId: string | null;
            razorpayPayoutId: string | null;
            utr: string | null;
        } | null;
    }>;
    createPayout(dto: CreatePayoutDto | {
        eventId: string;
        bankAccountId: string;
        type: 'T2' | 'INSTANT';
        platformFeePercent?: number;
        notes?: string;
    }, adminId: string): Promise<{
        user: {
            username: string | null;
            fullName: string | null;
        };
        event: {
            title: string;
        };
        bankAccount: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.BankAccountStatus;
            userId: string;
            isPrimary: boolean;
            rejectionReason: string | null;
            accountHolderName: string;
            accountNumber: string;
            ifscCode: string;
            bankName: string;
            accountType: string;
            upiId: string | null;
            razorpayContactId: string | null;
            razorpayFundAccountId: string | null;
            verifiedAt: Date | null;
            verifiedBy: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: import("@prisma/client").$Enums.PayoutType;
        status: import("@prisma/client").$Enums.PayoutStatus;
        createdBy: string | null;
        scheduledAt: Date;
        userId: string;
        eventId: string;
        notes: string | null;
        bankAccountId: string;
        platformFeePercent: import("@prisma/client/runtime/library").Decimal;
        grossRevenue: import("@prisma/client/runtime/library").Decimal;
        platformFee: import("@prisma/client/runtime/library").Decimal;
        instantFee: import("@prisma/client/runtime/library").Decimal;
        netAmount: import("@prisma/client/runtime/library").Decimal;
        processedAt: Date | null;
        completedAt: Date | null;
        failedAt: Date | null;
        failureReason: string | null;
        razorpayTransferId: string | null;
        razorpayPayoutId: string | null;
        utr: string | null;
    }>;
    processPayoutTransfer(payoutId: string): Promise<void>;
    cancelPayout(payoutId: string, adminId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: import("@prisma/client").$Enums.PayoutType;
        status: import("@prisma/client").$Enums.PayoutStatus;
        createdBy: string | null;
        scheduledAt: Date;
        userId: string;
        eventId: string;
        notes: string | null;
        bankAccountId: string;
        platformFeePercent: import("@prisma/client/runtime/library").Decimal;
        grossRevenue: import("@prisma/client/runtime/library").Decimal;
        platformFee: import("@prisma/client/runtime/library").Decimal;
        instantFee: import("@prisma/client/runtime/library").Decimal;
        netAmount: import("@prisma/client/runtime/library").Decimal;
        processedAt: Date | null;
        completedAt: Date | null;
        failedAt: Date | null;
        failureReason: string | null;
        razorpayTransferId: string | null;
        razorpayPayoutId: string | null;
        utr: string | null;
    }>;
    getAllPayouts(page?: number, limit?: number, status?: string): Promise<{
        payouts: ({
            user: {
                id: string;
                username: string | null;
                fullName: string | null;
            };
            event: {
                id: string;
                slug: string;
                title: string;
            };
            bankAccount: {
                accountNumber: string;
                bankName: string;
                upiId: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            type: import("@prisma/client").$Enums.PayoutType;
            status: import("@prisma/client").$Enums.PayoutStatus;
            createdBy: string | null;
            scheduledAt: Date;
            userId: string;
            eventId: string;
            notes: string | null;
            bankAccountId: string;
            platformFeePercent: import("@prisma/client/runtime/library").Decimal;
            grossRevenue: import("@prisma/client/runtime/library").Decimal;
            platformFee: import("@prisma/client/runtime/library").Decimal;
            instantFee: import("@prisma/client/runtime/library").Decimal;
            netAmount: import("@prisma/client/runtime/library").Decimal;
            processedAt: Date | null;
            completedAt: Date | null;
            failedAt: Date | null;
            failureReason: string | null;
            razorpayTransferId: string | null;
            razorpayPayoutId: string | null;
            utr: string | null;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getPayoutsForOrganiser(userId: string, page?: number, limit?: number): Promise<{
        payouts: ({
            event: {
                id: string;
                slug: string;
                title: string;
                startDateTime: Date;
            };
            bankAccount: {
                accountNumber: string;
                bankName: string;
                upiId: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            type: import("@prisma/client").$Enums.PayoutType;
            status: import("@prisma/client").$Enums.PayoutStatus;
            createdBy: string | null;
            scheduledAt: Date;
            userId: string;
            eventId: string;
            notes: string | null;
            bankAccountId: string;
            platformFeePercent: import("@prisma/client/runtime/library").Decimal;
            grossRevenue: import("@prisma/client/runtime/library").Decimal;
            platformFee: import("@prisma/client/runtime/library").Decimal;
            instantFee: import("@prisma/client/runtime/library").Decimal;
            netAmount: import("@prisma/client/runtime/library").Decimal;
            processedAt: Date | null;
            completedAt: Date | null;
            failedAt: Date | null;
            failureReason: string | null;
            razorpayTransferId: string | null;
            razorpayPayoutId: string | null;
            utr: string | null;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getAllBankAccounts(page?: number, limit?: number, status?: string): Promise<{
        accounts: ({
            user: {
                id: string;
                mobileNumber: string;
                username: string | null;
                fullName: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.BankAccountStatus;
            userId: string;
            isPrimary: boolean;
            rejectionReason: string | null;
            accountHolderName: string;
            accountNumber: string;
            ifscCode: string;
            bankName: string;
            accountType: string;
            upiId: string | null;
            razorpayContactId: string | null;
            razorpayFundAccountId: string | null;
            verifiedAt: Date | null;
            verifiedBy: string | null;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
}
