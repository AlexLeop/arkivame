
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const createKnowledgeSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  source: z.enum(['MANUAL', 'SLACK', 'TEAMS']).default('MANUAL'),
  channel: z.string().optional(),
  tags: z.array(z.string()).default([])
});

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
    const validatedData = createKnowledgeSchema.parse(body);

    // In a real app, we'd get the organization from the tenant/subdomain
    // For now, we'll simulate creating knowledge
    const knowledge = {
      id: Math.random().toString(36).substr(2, 9),
      title: validatedData.title,
      content: validatedData.content,
      source: validatedData.source,
      channel: validatedData.channel || '',
      tags: validatedData.tags,
      author: session.user.name || 'Unknown',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      views: 0,
      bookmarked: false
    };

    return NextResponse.json(knowledge, { status: 201 });
  } catch (error) {
    console.error('Knowledge creation error:', error);
    
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

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const source = searchParams.get('source') || 'all';
    const tag = searchParams.get('tag') || 'all';
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Mock data - in real app this would come from database
    let knowledge = [
      {
        id: '1',
        title: 'Database Migration Best Practices',
        content: 'When migrating databases, always follow these essential steps...',
        source: 'SLACK',
        channel: '#engineering',
        tags: ['database', 'migration', 'best-practices'],
        author: 'Sarah Chen',
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T10:30:00Z',
        views: 156,
        bookmarked: true
      },
      {
        id: '2',
        title: 'API Security Guidelines',
        content: 'Essential security measures for API development...',
        source: 'TEAMS',
        channel: 'Security Team',
        tags: ['security', 'api', 'guidelines'],
        author: 'Mike Johnson',
        createdAt: '2024-01-14T14:20:00Z',
        updatedAt: '2024-01-14T14:20:00Z',
        views: 234,
        bookmarked: false
      },
      {
        id: '3',
        title: 'React Performance Optimization',
        content: 'Tips and tricks for optimizing React applications...',
        source: 'MANUAL',
        channel: '',
        tags: ['react', 'performance', 'frontend'],
        author: 'David Kim',
        createdAt: '2024-01-13T09:15:00Z',
        updatedAt: '2024-01-13T09:15:00Z',
        views: 189,
        bookmarked: false
      }
    ];

    // Apply filters
    if (search) {
      knowledge = knowledge.filter(k => 
        k.title.toLowerCase().includes(search.toLowerCase()) ||
        k.content.toLowerCase().includes(search.toLowerCase()) ||
        k.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
      );
    }

    if (source !== 'all') {
      knowledge = knowledge.filter(k => k.source === source);
    }

    if (tag !== 'all') {
      knowledge = knowledge.filter(k => k.tags.includes(tag));
    }

    // Pagination
    const paginatedKnowledge = knowledge.slice(offset, offset + limit);

    return NextResponse.json({
      data: paginatedKnowledge,
      total: knowledge.length,
      limit,
      offset
    });
  } catch (error) {
    console.error('Knowledge fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
