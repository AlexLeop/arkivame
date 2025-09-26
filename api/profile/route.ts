
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../lib/auth-config';
import { z } from 'zod';

const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  bio: z.string().optional(),
  location: z.string().optional(),
  website: z.string().url().optional(),
});

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = updateProfileSchema.parse(body);

    // Mock profile update
    const updatedProfile = {
      id: session.user.id,
      name: validatedData.name,
      email: session.user.email,
      bio: validatedData.bio || '',
      location: validatedData.location || '',
      website: validatedData.website || '',
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json(updatedProfile);
  } catch (error) {
    console.error('Profile update error:', error);
    
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
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Mock profile data
    const profile = {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      bio: 'Full-stack developer with passion for clean code and great user experiences.',
      location: 'San Francisco, CA',
      website: 'https://example.com',
      joinedAt: '2024-01-01T00:00:00Z',
      lastActive: new Date().toISOString(),
      stats: {
        knowledgeCreated: 23,
        knowledgeBookmarked: 45,
        totalViews: 1247
      }
    };

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
