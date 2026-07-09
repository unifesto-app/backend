export declare class AddBankAccountDto {
    accountHolderName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    accountType?: string;
    upiId?: string;
    isPrimary?: boolean;
}
export declare class CreatePayoutDto {
    eventId: string;
    bankAccountId: string;
    type: 'T2' | 'INSTANT';
    platformFeePercent?: number;
    notes?: string;
}
export declare class UpdateBankAccountStatusDto {
    status: 'VERIFIED' | 'REJECTED';
    rejectionReason?: string;
}
