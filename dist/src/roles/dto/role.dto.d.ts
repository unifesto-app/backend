export declare enum RoleScope {
    GLOBAL = "global",
    PLATFORM = "platform",
    ORGANIZATION = "organization",
    EVENT = "event"
}
export declare class CreateRoleDto {
    name: string;
    code: string;
    scope: RoleScope;
    description?: string;
}
export declare class UpdateRoleDto {
    name?: string;
    code?: string;
    scope?: RoleScope;
    description?: string;
}
