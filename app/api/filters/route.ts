
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

// Sample saved filters
const sampleFilters = [
  {
    id: '1',
    name: 'Engineering Discussions',
    description: 'All engineering-related conversations',
    query: {
      tags: ['engineering', 'database', 'performance'],
      source: ['SLACK'],
      dateRange: 'last-30-days'
    },
    isPublic: true,
    createdBy: 'Mike Johnson',
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    usageCount: 23
  },
  {
    id: '2',
    name: 'Project Planning',
    description: 'Planning and roadmap discussions',
    query: {
      tags: ['planning', 'project-alpha', 'timeline'],
      source: ['SLACK', 'TEAMS'],
      dateRange: 'last-90-days'
    },
    isPublic: false,
    createdBy: 'Sarah Chen',
    createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
    usageCount: 45
  },
  {
    id: '3',
    name: 'Security & Compliance',
    description: 'Security discussions and audit findings',
    query: {
      tags: ['security', 'audit', 'compliance'],
      source: ['SLACK'],
      dateRange: 'all-time'
    },
    isPublic: true,
    createdBy: 'David Kim',
    createdAt: new Date(Date.now() - 86400000 * 21).toISOString(),
    usageCount: 12
  }
];

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      filters: sampleFilters,
      total: sampleFilters.length
    });

  } catch (error) {
    console.error('Filters API error:', error);
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
    const { name, description, query, isPublic = false } = body;

    if (!name || !query) {
      return NextResponse.json(
        { error: 'Name and query are required' },
        { status: 400 }
      );
    }

    // In a real app, you would save to database
    const newFilter = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      description: description || '',
      query,
      isPublic,
      createdBy: session.user.name || 'Unknown',
      createdAt: new Date().toISOString(),
      usageCount: 0
    };

    return NextResponse.json(newFilter, { status: 201 });

  } catch (error) {
    console.error('Filters POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
