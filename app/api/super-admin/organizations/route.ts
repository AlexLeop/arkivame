
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const skip = (page - 1) * limit;

    const [organizations, total] = await prisma.$transaction([
      prisma.organization.findMany({
        skip,
        take: limit,
        include: {
          _count: {
            select: { users: true, knowledgeItems: true },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.organization.count(),
    ]);

    const formattedOrganizations = organizations.map(org => ({
      ...org,
      userCount: org._count.users,
      knowledgeCount: org._count.knowledgeItems,
    }));

    return NextResponse.json({
      organizations: formattedOrganizations,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });

  } catch (error) {
    console.error('Super admin organizations API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, slug, domain, plan = 'STARTER' } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      );
    }

    // Save to database
    const newOrganization = await prisma.organization.create({
      data: {
        name,
        slug: slug.toLowerCase(),
        domain: domain || null,
        plan: plan as any,
        status: 'ACTIVE',
      }
    });

    return NextResponse.json(newOrganization, { status: 201 });

  } catch (error) {
    console.error('Super admin organizations POST error:', error);
    if ((error as any).code === 'P2002') { // Prisma unique constraint violation
      return NextResponse.json({ error: 'Slug or domain already in use.' }, { status: 409 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
