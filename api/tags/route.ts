
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../lib/auth-config';
import { z } from 'zod';

const createTagSchema = z.object({
  name: z.string().min(1, "Tag name is required"),
  color: z.string().optional(),
  description: z.string().optional(),
  parent: z.string().optional()
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

    // Mock tags data
    const tags = [
      { id: '1', name: 'engineering', color: '#3B82F6', count: 34, parent: null },
      { id: '2', name: 'frontend', color: '#10B981', count: 28, parent: '1' },
      { id: '3', name: 'backend', color: '#8B5CF6', count: 22, parent: '1' },
      { id: '4', name: 'database', color: '#F59E0B', count: 18, parent: '3' },
      { id: '5', name: 'security', color: '#EF4444', count: 25, parent: null },
      { id: '6', name: 'design', color: '#EC4899', count: 15, parent: null },
      { id: '7', name: 'planning', color: '#6366F1', count: 12, parent: null },
      { id: '8', name: 'best-practices', color: '#14B8A6', count: 30, parent: null }
    ];

    return NextResponse.json(tags);
  } catch (error) {
    console.error('Tags fetch error:', error);
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
    const validatedData = createTagSchema.parse(body);

    // Mock tag creation
    const tag = {
      id: Math.random().toString(36).substr(2, 9),
      name: validatedData.name.toLowerCase().replace(/\s+/g, '-'),
      color: validatedData.color || '#6B7280',
      description: validatedData.description || '',
      parent: validatedData.parent || null,
      count: 0,
      createdAt: new Date().toISOString()
    };

    return NextResponse.json(tag, { status: 201 });
  } catch (error) {
    console.error('Tag creation error:', error);
    
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
