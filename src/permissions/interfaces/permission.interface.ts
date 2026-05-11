// Organization relationship types (not roles)
export enum RelationshipType {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
}

// Legacy alias for backward compatibility
export const OrgRole = RelationshipType;

export enum PlatformRole {
  SUPER_ADMIN = 'super_admin',
  ORG_SUPER_ADMIN = 'org_super_admin',
  ORG_ADMIN = 'org_admin',
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
  role: RelationshipType;
  accessType: 'direct' | 'hierarchy' | 'platform';
}

export interface UserOrgAccess {
  orgId: string;
  orgName: string;
  orgSlug: string;
  orgType: string;
  userRole: RelationshipType;
  accessType: 'direct' | 'hierarchy';
  canManage: boolean;
  depthLevel: number;
}
