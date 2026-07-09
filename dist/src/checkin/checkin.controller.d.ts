import { CheckinService } from './checkin.service';
import { BulkCheckinDto, ScanQRCodeDto } from './dto';
export declare class CheckinController {
    private readonly checkinService;
    constructor(checkinService: CheckinService);
    scanQRCode(req: any, dto: ScanQRCodeDto): Promise<{
        alreadyCheckedIn: boolean;
        checkedInAt: any;
        attendee: any;
        ticketType: any;
        success?: undefined;
        coinsAwarded?: undefined;
    } | {
        success: boolean;
        checkedInAt: Date;
        attendee: any;
        ticketType: any;
        coinsAwarded: number;
        alreadyCheckedIn?: undefined;
    }>;
    getEventRegistrationsForOffline(req: any, id: string): Promise<{
        eventId: string;
        eventTitle: string;
        registrations: any[];
        totalCount: number;
        checkedInCount: number;
        fromCache: boolean;
    }>;
    getCheckinStats(req: any, id: string): Promise<{
        total: number;
        checkedIn: number;
        remaining: number;
        cancelled: number;
        checkInRate: string | number;
    }>;
    bulkCheckin(req: any, id: string, dto: BulkCheckinDto): Promise<{
        success: {
            id: string;
            name: string | null;
        }[];
        failed: {
            id: string;
            reason: string;
        }[];
        alreadyCheckedIn: {
            id: string;
            name: string | null;
        }[];
    }>;
}
