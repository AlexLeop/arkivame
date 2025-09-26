
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth-config';

// Sample tags data
const sampleTags = [
  { id: '1', name: 'planning', color: '#3B82F6', count: 34 },
  { id: '2', name: 'engineering', color: '#EF4444', count: 28 },
  { id: '3', name: 'design', color: '#10B981', count: 22 },
  { id: '4', name: 'security', color: '#F59E0B', count: 18 },
  { id: '5', name: 'performance', color: '#8B5CF6', count: 15 },
  { id: '6', name: 'project-alpha', color: '#06B6D4', count: 12 },
  { id: '7', name: 'database', color: '#84CC16', count: 9 },
  { id: '8', name: 'migration', color: '#EC4899', count: 7 },
  { id: '9', name: 'best-practices', color: '#F97316', count: 14 },
  { id: '10', name: 'customer-feedback', color: '#6366F1', count: 8 }
];

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      tags: sampleTags,
      total: sampleTags.length
    });

  } catch (error) {
    console.error('Tags API error:', error);
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, color = '#6B7280' } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Tag name is required' },
        { status: 400 }
      );
    }

    // In a real app, you would save to database
    const newTag = {
      id: Math.random().toString(36).substr(2, 9),
      name: name.toLowerCase().replace(/\s+/g, '-'),
      color,
      count: 0
    };

    return NextResponse.json(newTag, { status: 201 });

  } catch (error) {
    console.error('Tags POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
