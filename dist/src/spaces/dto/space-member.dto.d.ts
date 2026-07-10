declare const SPACE_MEMBER_ROLES: readonly ["ORGANISER", "CO_ORGANISER", "MEMBER", "VOLUNTEER"];
export declare class AddSpaceMemberDto {
    userId: string;
    role: (typeof SPACE_MEMBER_ROLES)[number];
}
export declare class UpdateSpaceMemberRoleDto {
    role: (typeof SPACE_MEMBER_ROLES)[number];
}
export {};
