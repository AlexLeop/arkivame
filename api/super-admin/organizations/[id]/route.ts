
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;

    // Mock organization data
    const organization = {
      id,
      name: 'Acme Corporation',
      slug: 'acme',
      domain: null,
      plan: 'BUSINESS',
      status: 'ACTIVE',
      userCount: 25,
      knowledgeCount: 142,
      createdAt: '2024-01-10T08:00:00Z',
      updatedAt: '2024-01-15T10:30:00Z',
      settings: {
        allowSignups: true,
        maxUsers: 50,
        customBranding: true
      }
    };

    return NextResponse.json(organization);
  } catch (error) {
    console.error('Organization fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
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
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;
    const body = await request.json();

    // Mock update
    const updatedOrganization = {
      id,
      ...body,
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json(updatedOrganization);
  } catch (error) {
    console.error('Organization update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
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
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;

    // In a real app, this would perform soft delete and cleanup
    
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Organization delete error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
