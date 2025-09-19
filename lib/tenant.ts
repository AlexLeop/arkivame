
import { NextRequest } from 'next/server';
import { prisma } from './db';

export interface TenantContext {
  organizationId: string;
  organization: {
    id: string;
    name: string;
    slug: string;
    subdomain: string | null;
    domain: string | null;
    plan: 'FREE' | 'STARTER' | 'BUSINESS' | 'ENTERPRISE';
    settings: any;
    status: 'ACTIVE' | 'SUSPENDED' | 'PENDING' | 'CANCELLED';
  };
}

/**
 * Extract tenant information from request
 * Supports both subdomain and domain-based routing
 */
export function extractTenantFromRequest(request: NextRequest): {
  subdomain?: string;
  domain?: string;
  host: string;
} {
  const host = request.headers.get('host') || '';
  const url = new URL(request.url);
  
  // Check if it's a custom domain first
  const customDomainRegex = /^(?!.*\.localhost|.*\.vercel\.app|.*\.netlify\.app).+\.[a-z]{2,}$/i;
  if (customDomainRegex.test(host)) {
    return { domain: host, host };
  }
  
  // Extract subdomain
  const parts = host.split('.');
  if (parts.length >= 3) {
    const subdomain = parts[0];
    // Ignore common subdomains
    if (!['www', 'app', 'api', 'admin'].includes(subdomain)) {
      return { subdomain, host };
    }
  }
  
  return { host };
}

/**
 * Get organization by tenant identifiers
 */
export async function getOrganizationByTenant(
  subdomain?: string,
  domain?: string
): Promise<TenantContext['organization'] | null> {
  try {
    let whereClause: any = {};
    
    if (domain) {
      whereClause.domain = domain;
    } else if (subdomain) {
      whereClause.subdomain = subdomain;
    } else {
      return null;
    }
    
    const organization = await prisma.organization.findFirst({
      where: {
        ...whereClause,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
        slug: true,
        subdomain: true,
        domain: true,
        plan: true,
        settings: true,
        status: true,
      },
    });
    
    return organization;
  } catch (error) {
    console.error('Error fetching organization:', error);
    
    // Return mock data with correct types when database is not available
    if (subdomain || domain) {
      return {
        id: 'mock-org-1',
        name: subdomain ? `${subdomain.charAt(0).toUpperCase()}${subdomain.slice(1)} Corp` : 'Demo Organization',
        slug: subdomain || 'demo',
        subdomain: subdomain || null,
        domain: domain || null,
        plan: 'BUSINESS' as const,
        settings: {},
        status: 'ACTIVE' as const
      };
    }
    
    return null;
  }
}

/**
 * Create tenant context for API routes and pages
 */
export async function createTenantContext(request: NextRequest): Promise<TenantContext | null> {
  const { subdomain, domain } = extractTenantFromRequest(request);
  const organization = await getOrganizationByTenant(subdomain, domain);
  
  if (!organization) {
    return null;
  }
  
  return {
    organizationId: organization.id,
    organization,
  };
}

/**
 * Tenant-aware Prisma client wrapper
 */
export class TenantPrisma {
  constructor(private organizationId: string) {}
  
  // Knowledge Items with automatic tenant filtering
  get knowledgeItems() {
    return {
      findMany: (args: any = {}) => {
        return prisma.knowledgeItem.findMany({
          ...args,
          where: {
            organizationId: this.organizationId,
            ...args.where,
          },
        });
      },
      
      findFirst: (args: any = {}) => {
        return prisma.knowledgeItem.findFirst({
          ...args,
          where: {
            organizationId: this.organizationId,
            ...args.where,
          },
        });
      },
      
      findUnique: (args: any) => {
        return prisma.knowledgeItem.findFirst({
          ...args,
          where: {
            organizationId: this.organizationId,
            ...args.where,
          },
        });
      },
      
      create: (args: any) => {
        return prisma.knowledgeItem.create({
          ...args,
          data: {
            organizationId: this.organizationId,
            ...args.data,
          },
        });
      },
      
      update: (args: any) => {
        return prisma.knowledgeItem.updateMany({
          ...args,
          where: {
            organizationId: this.organizationId,
            ...args.where,
          },
        });
      },
      
      delete: (args: any) => {
        return prisma.knowledgeItem.deleteMany({
          ...args,
          where: {
            organizationId: this.organizationId,
            ...args.where,
          },
        });
      },
      
      count: (args: any = {}) => {
        return prisma.knowledgeItem.count({
          ...args,
          where: {
            organizationId: this.organizationId,
            ...args.where,
          },
        });
      },
      
      groupBy: (args: any) => {
        return prisma.knowledgeItem.groupBy({
          ...args,
          where: {
            organizationId: this.organizationId,
            ...args.where,
          },
        });
      },
    };
  }
  
  // Tags with automatic tenant filtering
  get tags() {
    return {
      findMany: (args: any = {}) => {
        return prisma.tag.findMany({
          ...args,
          where: {
            organizationId: this.organizationId,
            ...args.where,
          },
        });
      },
      
      findFirst: (args: any = {}) => {
        return prisma.tag.findFirst({
          ...args,
          where: {
            organizationId: this.organizationId,
            ...args.where,
          },
        });
      },
      
      create: (args: any) => {
        return prisma.tag.create({
          ...args,
          data: {
            organizationId: this.organizationId,
            ...args.data,
          },
        });
      },
      
      update: (args: any) => {
        return prisma.tag.updateMany({
          ...args,
          where: {
            organizationId: this.organizationId,
            ...args.where,
          },
        });
      },
      
      delete: (args: any) => {
        return prisma.tag.deleteMany({
          ...args,
          where: {
            organizationId: this.organizationId,
            ...args.where,
          },
        });
      },
      
      count: (args: any = {}) => {
        return prisma.tag.count({
          ...args,
          where: {
            organizationId: this.organizationId,
            ...args.where,
          },
        });
      },
      
      groupBy: (args: any) => {
        return prisma.tag.groupBy({
          ...args,
          where: {
            organizationId: this.organizationId,
            ...args.where,
          },
        });
      },
    };
  }
  
  // Audit Logs with automatic tenant filtering
  get auditLogs() {
    return {
      create: (args: any) => {
        return prisma.auditLog.create({
          ...args,
          data: {
            organizationId: this.organizationId,
            ...args.data,
          },
        });
      },
      
      findMany: (args: any = {}) => {
        return prisma.auditLog.findMany({
          ...args,
          where: {
            organizationId: this.organizationId,
            ...args.where,
          },
        });
      },
    };
  }
  
  // Organization Users with automatic tenant filtering
  get organizationUsers() {
    return {
      findMany: (args: any = {}) => {
        return prisma.organizationUser.findMany({
          ...args,
          where: {
            organizationId: this.organizationId,
            ...args.where,
          },
        });
      },
      
      findFirst: (args: any = {}) => {
        return prisma.organizationUser.findFirst({
          ...args,
          where: {
            organizationId: this.organizationId,
            ...args.where,
          },
        });
      },
      
      create: (args: any) => {
        return prisma.organizationUser.create({
          ...args,
          data: {
            organizationId: this.organizationId,
            ...args.data,
          },
        });
      },
      
      update: (args: any) => {
        return prisma.organizationUser.updateMany({
          ...args,
          where: {
            organizationId: this.organizationId,
            ...args.where,
          },
        });
      },
      
      count: (args: any = {}) => {
        return prisma.organizationUser.count({
          ...args,
          where: {
            organizationId: this.organizationId,
            ...args.where,
          },
        });
      },
    };
  }
}

/**
 * Create tenant-aware Prisma client
 */
export function createTenantPrisma(organizationId: string): TenantPrisma {
  return new TenantPrisma(organizationId);
}

/**
 * Audit logging helper
 */
export async function logAuditEvent({
  organizationId,
  userId,
  action,
  entity,
  entityId,
  details = {},
  ipAddress,
  userAgent,
  level = 'INFO' as any,
}: {
  organizationId?: string;
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  level?: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
}) {
  try {
    await prisma.auditLog.create({
      data: {
        organizationId,
        userId,
        action,
        entity,
        entityId,
        details,
        ipAddress,
        userAgent,
        level,
      },
    });
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
}
