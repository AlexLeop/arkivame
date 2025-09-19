
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { createTenantContext, createTenantPrisma, logAuditEvent } from '@/lib/tenant';
import { prisma } from '@/lib/db';

export const dynamic = "force-dynamic";

export async function GET(
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
    
    const tenantPrisma = createTenantPrisma(tenantContext.organizationId);
    
    const knowledgeItem = await tenantPrisma.knowledgeItems.findUnique({
      where: { id: params.id },
      include: {
        creator: {
          select: {
            firstName: true,
            lastName: true,
            name: true,
            email: true
          }
        },
        archiver: {
          select: {
            firstName: true,
            lastName: true,
            name: true
          }
        },
        tags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
                slug: true,
                color: true,
                icon: true,
                description: true
              }
            }
          }
        }
      }
    });
    
    if (!knowledgeItem) {
      return NextResponse.json({ error: 'Knowledge item not found' }, { status: 404 });
    }
    
    // Increment view count
    await tenantPrisma.knowledgeItems.update({
      where: { id: params.id },
      data: {
        viewCount: { increment: 1 },
        lastViewedAt: new Date()
      }
    });
    
    return NextResponse.json(knowledgeItem);
    
  } catch (error) {
    console.error('Knowledge fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch knowledge item' },
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
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const tenantContext = await createTenantContext(request);
    if (!tenantContext) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }
    
    const tenantPrisma = createTenantPrisma(tenantContext.organizationId);
    const body = await request.json();
    
    const { title, content, summary, tags = [], isPublic } = body;
    
    // Check if item exists and user has permission
    const existingItem = await tenantPrisma.knowledgeItems.findFirst({
      where: { id: params.id }
    });
    
    if (!existingItem) {
      return NextResponse.json({ error: 'Knowledge item not found' }, { status: 404 });
    }
    
    // Update knowledge item
    const knowledgeItem = await tenantPrisma.knowledgeItems.update({
      where: { id: params.id },
      data: {
        ...(title && { title }),
        ...(content && { content }),
        ...(summary !== undefined && { summary }),
        ...(isPublic !== undefined && { isPublic }),
        updatedAt: new Date()
      }
    });
    
    // Update tags if provided
    if (tags.length >= 0) {
      // Remove existing tag assignments
      await prisma.tagAssignment.deleteMany({
        where: { knowledgeItemId: params.id }
      });
      
      // Add new tag assignments
      for (const tagId of tags) {
        await prisma.tagAssignment.create({
          data: {
            knowledgeItemId: params.id,
            tagId,
            assignedBy: session.user.id,
            isAutoAssigned: false
          }
        });
      }
    }
    
    // Log audit event
    await logAuditEvent({
      organizationId: tenantContext.organizationId,
      userId: session.user.id,
      action: 'knowledge.update',
      entity: 'KnowledgeItem',
      entityId: params.id,
      details: { title: title || existingItem.title, changes: Object.keys(body) },
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });
    
    return NextResponse.json(knowledgeItem);
    
  } catch (error) {
    console.error('Knowledge update error:', error);
    return NextResponse.json(
      { error: 'Failed to update knowledge item' },
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
    
    const tenantPrisma = createTenantPrisma(tenantContext.organizationId);
    
    // Check if item exists
    const existingItem = await tenantPrisma.knowledgeItems.findFirst({
      where: { id: params.id }
    });
    
    if (!existingItem) {
      return NextResponse.json({ error: 'Knowledge item not found' }, { status: 404 });
    }
    
    // Soft delete by updating status
    await tenantPrisma.knowledgeItems.update({
      where: { id: params.id },
      data: {
        status: 'DELETED',
        updatedAt: new Date()
      }
    });
    
    // Log audit event
    await logAuditEvent({
      organizationId: tenantContext.organizationId,
      userId: session.user.id,
      action: 'knowledge.delete',
      entity: 'KnowledgeItem',
      entityId: params.id,
      details: { title: existingItem.title },
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
      level: 'WARN'
    });
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Knowledge delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete knowledge item' },
      { status: 500 }
    );
  }
}
