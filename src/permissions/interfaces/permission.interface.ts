export enum OrgRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  ORGANIZER = 'organizer',
  MEMBER = 'member',
}

export enum PlatformRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  ORGANIZER = 'organizer',
  ATTENDEE = 'attendee',
}

export interface OrgPermissions {
  canManageOrg: boolean;
  canManageSubOrgs: boolean;
  canManageMembers: boolean;
  canCreateEvents: boolean;
  canManageEvents: boolean;
  canApproveEvents: boolean;
  canViewAnalytics: boolean;
  canExportReports: boolean;
  analyticsScope: 'none' | 'events' | 'organization' | 'hierarchy';
  eventScope: 'all' | 'own';
  role: OrgRole;
  accessType: 'direct' | 'hierarchy' | 'platform';
}

export interface UserOrgAccess {
  orgId: string;
  orgName: string;
  orgSlug: string;
  orgType: string;
  userRole: OrgRole;
  accessType: 'direct' | 'hierarchy';
  canManage: boolean;
  depthLevel: number;
}
