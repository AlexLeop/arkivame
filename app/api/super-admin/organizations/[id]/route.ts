
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../lib/auth-config';
import { prisma } from '@/lib/db';
import { logAuditEvent } from '@/lib/tenant';

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const organization = await prisma.organization.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            users: { where: { isActive: true } },
            knowledgeBase: { where: { status: 'PUBLISHED' } },
            tags: { where: { isActive: true } },
            auditLogs: true
          }
        },
        users: {
          where: { isActive: true },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                name: true,
                lastLoginAt: true
              }
            }
          },
          orderBy: { joinedAt: 'desc' },
          take: 10
        }
      }
    });
    
    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }
    
    return NextResponse.json(organization);
    
  } catch (error) {
    console.error('Super admin get organization error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organization' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { name, plan, status, settings, planLimits } = body;
    
    const organization = await prisma.organization.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(plan && { plan }),
        ...(status && { status }),
        ...(settings && { settings }),
        ...(planLimits && { planLimits }),
        updatedAt: new Date()
      }
    });
    
    // Log audit event
    await logAuditEvent({
      organizationId: organization.id,
      userId: session.user.id,
      action: 'organization.update',
      entity: 'Organization',
      entityId: organization.id,
      details: { changes: { name, plan, status, settings, planLimits } },
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });
    
    return NextResponse.json(organization);
    
  } catch (error) {
    console.error('Super admin update organization error:', error);
    return NextResponse.json(
      { error: 'Failed to update organization' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Soft delete by updating status
    const organization = await prisma.organization.update({
      where: { id: params.id },
      data: {
        status: 'CANCELLED',
        updatedAt: new Date()
      }
    });
    
    // Log audit event
    await logAuditEvent({
      organizationId: organization.id,
      userId: session.user.id,
      action: 'organization.delete',
      entity: 'Organization',
      entityId: organization.id,
      details: { name: organization.name },
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
      level: 'WARN'
    });
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Super admin delete organization error:', error);
    return NextResponse.json(
      { error: 'Failed to delete organization' },
      { status: 500 }
    );
  }
}
