export type UserRole =
  | 'SUPER_OWNER'
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'COORDINATOR'
  | 'STAFF'
  | 'AGENT';

export type AccountStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'DISABLED';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  accountStatus: AccountStatus;
  phone?: string;
  cnic?: string;
  pinHash?: string;
  pinSalt?: string;
  defaultOrgId?: string;
  createdAt: string;
  updatedAt: string;
}

export type OrgType =
  | 'VOCATIONAL_ACADEMY'
  | 'TECHNICAL_COLLEGE'
  | 'PRIVATE_INSTITUTE'
  | 'ENTERPRISE_ACADEMY'
  | 'NAVTTC_AFFILIATED'
  | 'HYBRID';
export type OrgStatus = 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';

export type SubscriptionTier = 'STARTER' | 'GROWTH' | 'ENTERPRISE' | 'CUSTOM';
export type SubscriptionStatus = 'ACTIVE' | 'TRIAL' | 'PAST_DUE' | 'SUSPENDED';

export type PlatformModule =
  | 'CORE_OPERATIONS'
  | 'ACADEMICS'
  | 'ATTENDANCE'
  | 'FINANCE'
  | 'CRM_LEADS'
  | 'COMMUNICATIONS'
  | 'WHATSAPP_INTEGRATION'
  | 'ADVANCED_REPORTING'
  | 'AUTOMATION'
  | 'NAVTTC_COMPLIANCE';

export interface OrganizationSubscription {
  planTier: SubscriptionTier;
  status: SubscriptionStatus;
  validUntil?: string;
  enabledModules: PlatformModule[];
  maxBatches?: number;
  maxStudents?: number;
  maxStaff?: number;
}

export interface Organization {
  id: string;
  name: string;
  code: string;
  type: OrgType;
  city: string;
  address?: string;
  contactEmail?: string;
  contactPhone?: string;
  status: OrgStatus;
  activeBatchesCount?: number;
  totalStudentsCount?: number;
  subscription?: OrganizationSubscription;
  createdAt: string;
  updatedAt: string;
}

export interface Membership {
  id: string;
  userId: string;
  organizationId: string;
  role: UserRole;
  permissions: string[];
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  actorUid: string;
  actorEmail: string;
  organizationId: string;
  action: string;
  entityType: string;
  entityId: string;
  occurredAt: string;
  metadata?: Record<string, unknown>;
}

export interface StaffCreationPayload {
  name: string;
  email: string;
  initialPin: string;
  contactPhone?: string;
  cnic?: string;
  organizationId: string;
  role: UserRole;
  permissions: string[];
}
