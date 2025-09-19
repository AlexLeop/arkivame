
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
    
    const tag = await tenantPrisma.tags.findFirst({
      where: { id: params.id },
      include: {
        parent: true,
        children: {
          orderBy: { name: 'asc' }
        },
        assignments: {
          include: {
            knowledgeItem: {
              select: {
                id: true,
                title: true,
                createdAt: true,
                viewCount: true
              }
            }
          },
          orderBy: { assignedAt: 'desc' }
        },
        _count: {
          select: {
            assignments: true,
            children: true
          }
        }
      }
    });
    
    if (!tag) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
    }
    
    return NextResponse.json(tag);
    
  } catch (error) {
    console.error('Tag fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tag' },
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
    
    const { name, description, color, icon, parentId } = body;
    
    // Check if tag exists
    const existingTag = await tenantPrisma.tags.findFirst({
      where: { id: params.id }
    });
    
    if (!existingTag) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
    }
    
    // Check if system tag
    if (existingTag.isSystem) {
      return NextResponse.json(
        { error: 'Cannot modify system tags' },
        { status: 400 }
      );
    }
    
    const updateData: any = {};
    
    if (name && name !== existingTag.name) {
      const slug = name.toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      
      // Check if new slug exists
      const existingSlug = await tenantPrisma.tags.findFirst({
        where: { 
          slug,
          id: { not: params.id }
        }
      });
      
      if (existingSlug) {
        return NextResponse.json(
          { error: 'A tag with this name already exists' },
          { status: 400 }
        );
      }
      
      updateData.name = name;
      updateData.slug = slug;
    }
    
    if (description !== undefined) updateData.description = description;
    if (color) updateData.color = color;
    if (icon !== undefined) updateData.icon = icon;
    
    // Handle parent change
    if (parentId !== undefined) {
      let level = 0;
      let path = updateData.slug || existingTag.slug;
      
      if (parentId) {
        const parentTag = await tenantPrisma.tags.findFirst({
          where: { id: parentId }
        });
        
        if (!parentTag) {
          return NextResponse.json(
            { error: 'Parent tag not found' },
            { status: 400 }
          );
        }
        
        level = parentTag.level + 1;
        path = `${parentTag.path}/${updateData.slug || existingTag.slug}`;
        
        // Prevent deep nesting
        if (level > 2) {
          return NextResponse.json(
            { error: 'Maximum tag nesting level (3) exceeded' },
            { status: 400 }
          );
        }
      }
      
      updateData.parentId = parentId || null;
      updateData.level = level;
      updateData.path = path;
    }
    
    const tag = await tenantPrisma.tags.update({
      where: { id: params.id },
      data: updateData
    });
    
    // Log audit event
    await logAuditEvent({
      organizationId: tenantContext.organizationId,
      userId: session.user.id,
      action: 'tag.update',
      entity: 'Tag',
      entityId: params.id,
      details: { 
        name: existingTag.name, 
        changes: Object.keys(updateData)
      },
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });
    
    return NextResponse.json(tag);
    
  } catch (error) {
    console.error('Tag update error:', error);
    return NextResponse.json(
      { error: 'Failed to update tag' },
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
    
    // Check if tag exists and has children
    const [tag, childrenCount] = await Promise.all([
      tenantPrisma.tags.findFirst({
        where: { id: params.id }
      }),
      prisma.tag.count({
        where: { 
          parentId: params.id,
          organizationId: tenantContext.organizationId 
        }
      })
    ]);
    
    if (!tag) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
    }
    
    if (tag.isSystem) {
      return NextResponse.json(
        { error: 'Cannot delete system tags' },
        { status: 400 }
      );
    }
    
    if (childrenCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete tag with child tags. Delete or move child tags first.' },
        { status: 400 }
      );
    }
    
    // Soft delete by marking as inactive
    await tenantPrisma.tags.update({
      where: { id: params.id },
      data: {
        isActive: false,
        updatedAt: new Date()
      }
    });
    
    // Log audit event
    await logAuditEvent({
      organizationId: tenantContext.organizationId,
      userId: session.user.id,
      action: 'tag.delete',
      entity: 'Tag',
      entityId: params.id,
      details: { 
        name: tag.name, 
        childrenCount: childrenCount 
      },
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
      level: 'WARN'
    });
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Tag delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete tag' },
      { status: 500 }
    );
  }
}
