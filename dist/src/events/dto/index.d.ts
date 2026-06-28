import { EventType, EventVisibility, RegistrationType, FormFieldType } from '@prisma/client';
export declare class CreateEventDto {
    title: string;
    description?: string;
    type: EventType;
    registrationType: RegistrationType;
    startDateTime: string;
    endDateTime: string;
    timezone?: string;
    venueName?: string;
    venueAddress?: string;
    city?: string;
    state?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
    onlineUrl?: string;
    onlinePlatform?: string;
    capacity?: number;
    waitlistEnabled?: boolean;
    isFree?: boolean;
    tags?: string[];
    category?: string;
    visibility: EventVisibility;
    spaceId: string;
}
export declare class UpdateEventDto {
    title?: string;
    description?: string;
    type?: EventType;
    startDateTime?: string;
    endDateTime?: string;
    venueName?: string;
    venueAddress?: string;
    city?: string;
    onlineUrl?: string;
    capacity?: number;
    waitlistEnabled?: boolean;
    tags?: string[];
    visibility?: EventVisibility;
}
export declare class CancelEventDto {
    reason: string;
}
export declare class CreateTicketTypeDto {
    name: string;
    description?: string;
    price: number;
    totalQuantity: number;
    saleStartsAt?: string;
    saleEndsAt?: string;
    perUserLimit?: number;
    order?: number;
}
export declare class UpdateTicketTypeDto {
    name?: string;
    description?: string;
    price?: number;
    totalQuantity?: number;
    saleStartsAt?: string;
    saleEndsAt?: string;
    isVisible?: boolean;
    isActive?: boolean;
}
export declare class CreateAgendaDto {
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    speakerName?: string;
    order?: number;
}
export declare class CreateSpeakerDto {
    name: string;
    bio?: string;
    avatarUrl?: string;
    designation?: string;
    company?: string;
    linkedinUrl?: string;
    order?: number;
}
export declare class CreateFormFieldDto {
    label: string;
    type: FormFieldType;
    options?: string[];
    isRequired?: boolean;
    order?: number;
}
export declare class EventFilterDto {
    city?: string;
    type?: EventType;
    category?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    spaceId?: string;
    page?: number;
    limit?: number;
}
