
// Define types manually to avoid bundling Prisma in browser

export type Plan = 'FREE' | 'STARTER' | 'BUSINESS' | 'ENTERPRISE';
export type OrgStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING' | 'CANCELLED';
export type GlobalRole = 'SUPER_ADMIN' | 'ADMIN' | 'USER';
export type OrgRole = 'OWNER' | 'ADMIN' | 'MODERATOR' | 'MEMBER' | 'VIEWER';
export type SourceType = 'SLACK' | 'TEAMS' | 'MANUAL' | 'API' | 'IMPORT';
export type ContentStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'DELETED';
export type IntegrationType = 'SLACK' | 'TEAMS' | 'NOTION' | 'CONFLUENCE' | 'JIRA' | 'WEBHOOK';
export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';

export interface User {
  id: string;
  email: string;
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  image?: string | null;
  password: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'USER';
  isActive: boolean;
  lastLoginAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  subdomain?: string | null;
  domain?: string | null;
  plan: Plan;
  planLimits: any;
  settings: any;
  status: OrgStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface KnowledgeItem {
  id: string;
  organizationId: string;
  title: string;
  content: any;
  summary?: string | null;
  threadId?: string | null;
  channelId?: string | null;
  channelName?: string | null;
  sourceType: SourceType;
  sourceMetadata: any;
  createdById: string;
  archivedById?: string | null;
  rootMessageAuthor?: string | null;
  viewCount: number;
  searchCount: number;
  lastViewedAt?: Date | null;
  status: ContentStatus;
  isPublic: boolean;
  originalTimestamp?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Tag {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  description?: string | null;
  color: string;
  icon?: string | null;
  parentId?: string | null;
  level: number;
  path: string;
  isAutoSuggested: boolean;
  usageCount: number;
  isActive: boolean;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditLog {
  id: string;
  organizationId?: string | null;
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  details: any;
  ipAddress?: string | null;
  userAgent?: string | null;
  level: LogLevel;
  source: string;
  timestamp: Date;
}

export interface ExtendedUser extends User {
  organizations?: Array<{
    id: string;
    name: string;
    slug: string;
    role: string;
    plan: string;
  }>;
}

export interface ExtendedKnowledgeItem extends KnowledgeItem {
  organization?: Organization;
  creator?: User;
  archiver?: User;
  tags?: Array<{
    id: string;
    tag: Tag;
    assignedAt: Date;
    isAutoAssigned: boolean;
  }>;
}

export interface ExtendedTag extends Tag {
  organization?: Organization;
  parent?: Tag;
  children?: Tag[];
  assignments?: Array<{
    id: string;
    knowledgeItem: KnowledgeItem;
  }>;
  _count?: {
    assignments: number;
    children: number;
  };
}

export interface TagHierarchy extends Tag {
  children: TagHierarchy[];
  depth: number;
}

export interface SearchFilters {
  query?: string;
  tags?: string[];
  sourceType?: string;
  channelName?: string;
  author?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: string;
}

export interface SavedFilter {
  id: string;
  name: string;
  description?: string | null;
  filterConfig: SearchFilters;
  isPublic: boolean;
  isDefault: boolean;
  usageCount: number;
  lastUsedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  organizationId: string;
  userId: string;
}

export interface AnalyticsData {
  totalKnowledgeItems: number;
  totalTags: number;
  totalUsers: number;
  recentActivity: Array<{
    date: string;
    knowledge: number;
    views: number;
    searches: number;
  }>;
  topChannels: Array<{
    name: string;
    count: number;
  }>;
  topTags: Array<{
    name: string;
    count: number;
  }>;
  topContributors: Array<{
    name: string;
    count: number;
  }>;
}

export interface SuperAdminAnalytics {
  totalOrganizations: number;
  totalUsers: number;
  totalKnowledgeItems: number;
  organizationsByPlan: Array<{
    plan: string;
    count: number;
    revenue?: number;
  }>;
  recentSignups: Array<{
    date: string;
    organizations: number;
    users: number;
  }>;
  topOrganizations: Array<{
    name: string;
    plan: string;
    users: number;
    knowledgeItems: number;
    createdAt: Date;
  }>;
  systemHealth: {
    uptime: number;
    totalRequests: number;
    errors: number;
    avgResponseTime: number;
  };
}

export interface MessageContent {
  author: string;
  text: string;
  timestamp: string;
  attachments?: Array<{
    type: string;
    url: string;
    name: string;
  }>;
}

export interface ChatMessage {
  author: string;
  content: string;
}

export interface ThreadContent {
  messages: MessageContent[];
  metadata: {
    channelId?: string;
    channelName?: string;
    threadId?: string;
    platform: 'slack' | 'teams' | 'manual';
  };
}

// Next-Auth augmentation
declare module 'next-auth' {
  interface Session {
    user: ExtendedUser;
  }
  
  interface User {
    role: 'SUPER_ADMIN' | 'ADMIN' | 'USER';
    organizations?: Array<{
      id: string;
      name: string;
      slug: string;
      role: string;
      plan: string;
    }>;
    firstName?: string | null;
    lastName?: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: 'SUPER_ADMIN' | 'ADMIN' | 'USER';
    organizations?: Array<{
      id: string;
      name: string;
      slug: string;
      role: string;
      plan: string;
    }>;
    firstName?: string | null;
    lastName?: string | null;
  }
}
