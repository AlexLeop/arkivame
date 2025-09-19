
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { z } from 'zod';

const createOrgSchema = z.object({
  name: z.string().min(1, "Organization name is required"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  domain: z.string().optional(),
  plan: z.enum(['FREE', 'STARTER', 'BUSINESS', 'ENTERPRISE']).default('STARTER')
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createOrgSchema.parse(body);

    // Check if slug already exists (mock check)
    const existingSlugs = ['demo', 'test', 'admin', 'api'];
    if (existingSlugs.includes(validatedData.slug)) {
      return NextResponse.json(
        { error: 'Slug already exists' },
        { status: 409 }
      );
    }

    // Create organization (mock creation)
    const organization = {
      id: Math.random().toString(36).substr(2, 9),
      name: validatedData.name,
      slug: validatedData.slug,
      domain: validatedData.domain || null,
      plan: validatedData.plan,
      status: 'ACTIVE' as const,
      userCount: 0,
      knowledgeCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json(organization, { status: 201 });
  } catch (error) {
    console.error('Organization creation error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Mock organizations data
    let organizations = [
      {
        id: '1',
        name: 'Acme Corporation',
        slug: 'acme',
        domain: null,
        plan: 'BUSINESS' as const,
        status: 'ACTIVE' as const,
        userCount: 25,
        knowledgeCount: 142,
        createdAt: '2024-01-10T08:00:00Z',
        updatedAt: '2024-01-15T10:30:00Z'
      },
      {
        id: '2',
        name: 'TechStart Inc',
        slug: 'techstart',
        domain: 'knowledge.techstart.com',
        plan: 'STARTER' as const,
        status: 'ACTIVE' as const,
        userCount: 8,
        knowledgeCount: 67,
        createdAt: '2024-01-12T14:20:00Z',
        updatedAt: '2024-01-14T16:45:00Z'
      },
      {
        id: '3',
        name: 'Global Solutions',
        slug: 'global-solutions',
        domain: null,
        plan: 'ENTERPRISE' as const,
        status: 'ACTIVE' as const,
        userCount: 150,
        knowledgeCount: 891,
        createdAt: '2024-01-08T12:15:00Z',
        updatedAt: '2024-01-15T09:22:00Z'
      },
      {
        id: '4',
        name: 'Beta Testing Co',
        slug: 'beta-testing',
        domain: null,
        plan: 'FREE' as const,
        status: 'SUSPENDED' as const,
        userCount: 3,
        knowledgeCount: 12,
        createdAt: '2024-01-14T16:30:00Z',
        updatedAt: '2024-01-14T16:30:00Z'
      }
    ];

    // Apply filters
    if (search) {
      organizations = organizations.filter(org => 
        org.name.toLowerCase().includes(search.toLowerCase()) ||
        org.slug.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (status !== 'all') {
      organizations = organizations.filter(org => org.status === status);
    }

    // Pagination
    const paginatedOrganizations = organizations.slice(offset, offset + limit);

    return NextResponse.json({
      data: paginatedOrganizations,
      total: organizations.length,
      limit,
      offset
    });
  } catch (error) {
    console.error('Organizations fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
