
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth-config';
import { createTenantContext, logAuditEvent } from '@/lib/tenant';
import { prisma } from '@/lib/db';

export const dynamic = "force-dynamic";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const tenantContext = await createTenantContext(request);
    if (!tenantContext) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }
    
    const body = await request.json();
    const { name, description, filterConfig, isPublic, isDefault } = body;
    
    // Check if filter exists and user owns it
    const existingFilter = await prisma.savedFilter.findFirst({
      where: {
        id: params.id,
        organizationId: tenantContext.organizationId,
        userId: session.user.id
      }
    });
    
    if (!existingFilter) {
      return NextResponse.json({ error: 'Filter not found' }, { status: 404 });
    }
    
    // If setting as default, unset other defaults
    if (isDefault && !existingFilter.isDefault) {
      await prisma.savedFilter.updateMany({
        where: {
          organizationId: tenantContext.organizationId,
          userId: session.user.id,
          isDefault: true,
          id: { not: params.id }
        },
        data: { isDefault: false }
      });
    }
    
    const filter = await prisma.savedFilter.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(filterConfig && { filterConfig }),
        ...(isPublic !== undefined && { isPublic }),
        ...(isDefault !== undefined && { isDefault }),
        updatedAt: new Date()
      }
    });
    
    // Log audit event
    await logAuditEvent({
      organizationId: tenantContext.organizationId,
      userId: session.user.id,
      action: 'filter.update',
      entity: 'SavedFilter',
      entityId: params.id,
      details: { name: filter.name },
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });
    
    return NextResponse.json(filter);
    
  } catch (error) {
    console.error('Filter update error:', error);
    return NextResponse.json(
      { error: 'Failed to update saved filter' },
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
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const tenantContext = await createTenantContext(request);
    if (!tenantContext) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }
    
    // Check if filter exists and user owns it
    const existingFilter = await prisma.savedFilter.findFirst({
      where: {
        id: params.id,
        organizationId: tenantContext.organizationId,
        userId: session.user.id
      }
    });
    
    if (!existingFilter) {
      return NextResponse.json({ error: 'Filter not found' }, { status: 404 });
    }
    
    await prisma.savedFilter.delete({
      where: { id: params.id }
    });
    
    // Log audit event
    await logAuditEvent({
      organizationId: tenantContext.organizationId,
      userId: session.user.id,
      action: 'filter.delete',
      entity: 'SavedFilter',
      entityId: params.id,
      details: { name: existingFilter.name },
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Filter delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete saved filter' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const tenantContext = await createTenantContext(request);
    if (!tenantContext) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }
    
    const body = await request.json();
    const { action } = body;
    
    if (action === 'use') {
      // Increment usage count
      const filter = await prisma.savedFilter.update({
        where: {
          id: params.id,
          organizationId: tenantContext.organizationId
        },
        data: {
          usageCount: { increment: 1 },
          lastUsedAt: new Date()
        }
      });
      
      return NextResponse.json(filter);
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    
  } catch (error) {
    console.error('Filter action error:', error);
    return NextResponse.json(
      { error: 'Failed to perform filter action' },
      { status: 500 }
    );
  }
}
