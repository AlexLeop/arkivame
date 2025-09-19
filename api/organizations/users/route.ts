
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { z } from 'zod';

const inviteUserSchema = z.object({
  email: z.string().email("Valid email is required"),
  role: z.enum(['ADMIN', 'EDITOR', 'VIEWER']).default('VIEWER'),
  message: z.string().optional()
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || 'all';
    const status = searchParams.get('status') || 'all';

    // Mock organization users
    let users = [
      {
        id: '1',
        name: 'Sarah Chen',
        email: 'sarah@acme.com',
        role: 'ADMIN',
        status: 'ACTIVE',
        avatar: null,
        lastActive: '2024-01-15T10:30:00Z',
        joinedAt: '2024-01-01T00:00:00Z',
        knowledgeCount: 23,
        contributionScore: 95
      },
      {
        id: '2',
        name: 'Mike Johnson',
        email: 'mike@acme.com', 
        role: 'EDITOR',
        status: 'ACTIVE',
        avatar: null,
        lastActive: '2024-01-15T08:45:00Z',
        joinedAt: '2024-01-05T00:00:00Z',
        knowledgeCount: 15,
        contributionScore: 78
      },
      {
        id: '3',
        name: 'David Kim',
        email: 'david@acme.com',
        role: 'VIEWER',
        status: 'PENDING',
        avatar: null,
        lastActive: null,
        joinedAt: '2024-01-14T00:00:00Z',
        knowledgeCount: 0,
        contributionScore: 0
      }
    ];

    // Apply filters
    if (search) {
      users = users.filter(user => 
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (role !== 'all') {
      users = users.filter(user => user.role === role);
    }

    if (status !== 'all') {
      users = users.filter(user => user.status === status);
    }

    return NextResponse.json({
      data: users,
      total: users.length
    });
  } catch (error) {
    console.error('Users fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = inviteUserSchema.parse(body);

    // Check if user already exists in organization
    if (validatedData.email === 'existing@acme.com') {
      return NextResponse.json(
        { error: 'User already exists in this organization' },
        { status: 409 }
      );
    }

    // Mock user invitation
    const invitation = {
      id: Math.random().toString(36).substr(2, 9),
      email: validatedData.email,
      role: validatedData.role,
      status: 'PENDING',
      invitedBy: session.user.name,
      invitedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      message: validatedData.message
    };

    return NextResponse.json(invitation, { status: 201 });
  } catch (error) {
    console.error('User invite error:', error);
    
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
