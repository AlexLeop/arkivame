import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth-config';
import { prisma } from '@/lib/db';

// Sample knowledge data for demonstration (fallback)
const sampleKnowledgeItems = [
  {
    id: '1',
    title: 'Project Alpha Planning Discussion',
    content: 'We discussed the initial requirements for Project Alpha, including timeline, resources, and key milestones. The team agreed on a 6-month development cycle.',
    source: 'SLACK' as const,
    channel: '#project-alpha',
    author: 'Sarah Chen',
    tags: ['planning', 'project-alpha', 'timeline'],
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    views: 45,
    bookmarked: true,
    summary: 'Project Alpha planning session with timeline and resource allocation',
    actionItems: ['Define detailed requirements', 'Set up development environment'],
    decisions: ['6-month development cycle approved'],
    participants: ['Sarah Chen', 'Mike Johnson', 'Lisa Wang'],
    originalUrl: 'https://slack.com/archives/C123456/p1234567890'
  },
  {
    id: '2',
    title: 'Database Migration Best Practices',
    content: 'Key points from our database migration discussion: always backup before migration, test on staging first, monitor performance during rollout, have rollback plan ready.',
    source: 'TEAMS' as const,
    channel: 'Engineering Team',
    author: 'Mike Johnson',
    tags: ['database', 'migration', 'best-practices', 'engineering'],
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    views: 78,
    bookmarked: false,
    summary: 'Database migration best practices and safety procedures',
    actionItems: ['Create backup procedure', 'Set up staging environment'],
    decisions: ['Always test on staging first'],
    participants: ['Mike Johnson', 'Alex Rodriguez'],
    originalUrl: null
  },
  {
    id: '3',
    title: 'Customer Feedback Analysis Q3',
    content: 'Summary of Q3 customer feedback: 85% satisfaction rate, main request for better mobile experience, integration with third-party tools highly requested.',
    source: 'MANUAL' as const,
    channel: 'Manual Entry',
    author: 'Lisa Wang',
    tags: ['customer-feedback', 'q3', 'mobile', 'integrations'],
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    views: 32,
    bookmarked: true,
    summary: 'Q3 customer feedback analysis showing high satisfaction and feature requests',
    actionItems: ['Improve mobile experience', 'Research third-party integrations'],
    decisions: ['Prioritize mobile improvements for Q4'],
    participants: ['Lisa Wang', 'Customer Success Team'],
    originalUrl: null
  }
];

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Extract pagination parameters from URL
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const search = searchParams.get('search') || '';
    const tags = searchParams.get('tags')?.split(',').filter(Boolean) || [];
    const source = searchParams.get('source') || '';
    const author = searchParams.get('author') || '';
    const dateRange = searchParams.get('dateRange') || '';

    // Validate pagination parameters
    const validatedPage = Math.max(1, page);
    const validatedLimit = Math.min(Math.max(1, limit), 100);

    try {
      // Try to get user's organization
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { 
          organizations: {
            include: { organization: true }
          }
        }
      });

      if (!user || user.organizations.length === 0) {
        // Fallback to sample data if no organization
        return handleSampleData(validatedPage, validatedLimit, search, tags, source, author, dateRange);
      }

      const organizationId = user.organizations[0].organizationId;

      // Build where clause for filtering
      const whereClause: any = {
        organizationId: organizationId
      };

      if (search) {
        whereClause.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { content: { contains: search, mode: 'insensitive' } },
          { author: { contains: search, mode: 'insensitive' } }
        ];
      }

      if (source && source !== 'all') {
        whereClause.source = source;
      }

      if (author && author !== 'all') {
        whereClause.author = { contains: author, mode: 'insensitive' };
      }

      if (tags.length > 0) {
        whereClause.tags = {
          hasSome: tags
        };
      }

      // Handle date range filtering
      if (dateRange && dateRange !== 'all') {
        const now = new Date();
        let startDate: Date;
        
        switch (dateRange) {
          case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          case 'quarter':
            const quarter = Math.floor(now.getMonth() / 3);
            startDate = new Date(now.getFullYear(), quarter * 3, 1);
            break;
          default:
            startDate = new Date(0);
        }
        
        whereClause.createdAt = {
          gte: startDate
        };
      }

      // Get total count for pagination
      const totalItems = await prisma.knowledgeItem.count({
        where: whereClause
      });

      // Get paginated items
      const items = await prisma.knowledgeItem.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip: (validatedPage - 1) * validatedLimit,
        take: validatedLimit,
        select: {
          id: true,
          title: true,
          content: true,
          sourceType: true,
          channelId: true,
          tags: true,
          createdAt: true,
          updatedAt: true,
          viewCount: true,
          summary: true,
          actionItems: true,
        }
      });

      // Calculate pagination metadata
      const totalPages = Math.ceil(totalItems / validatedLimit);
      const hasNextPage = validatedPage < totalPages;
      const hasPrevPage = validatedPage > 1;

      return NextResponse.json({
        items: items,
        pagination: {
          page: validatedPage,
          limit: validatedLimit,
          total: totalItems,
          totalPages,
          hasNextPage,
          hasPrevPage,
          hasMore: hasNextPage
        },
        filters: {
          search,
          tags,
          source,
          author,
          dateRange
        }
      });

    } catch (dbError) {
      console.error('Database error, falling back to sample data:', dbError);
      return handleSampleData(validatedPage, validatedLimit, search, tags, source, author, dateRange);
    }

  } catch (error) {
    console.error('Knowledge API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function handleSampleData(
  page: number, 
  limit: number, 
  search: string, 
  tags: string[], 
  source: string, 
  author: string, 
  dateRange: string
) {
  let filteredItems = [...sampleKnowledgeItems];

  // Apply filters
  if (search) {
    const searchLower = search.toLowerCase();
    filteredItems = filteredItems.filter(item => 
      item.title.toLowerCase().includes(searchLower) ||
      item.content.toLowerCase().includes(searchLower) ||
      item.author.toLowerCase().includes(searchLower)
    );
  }

  if (tags.length > 0) {
    filteredItems = filteredItems.filter(item =>
      tags.some(tag => item.tags.includes(tag))
    );
  }

  if (source && source !== 'all') {
    filteredItems = filteredItems.filter(item => item.source === source);
  }

  if (author && author !== 'all') {
    filteredItems = filteredItems.filter(item => 
      item.author.toLowerCase().includes(author.toLowerCase())
    );
  }

  // Apply date range filter
  if (dateRange && dateRange !== 'all') {
    const now = new Date();
    let startDate: Date;
    
    switch (dateRange) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        startDate = new Date(0);
    }
    
    filteredItems = filteredItems.filter(item => 
      new Date(item.createdAt) >= startDate
    );
  }

  // Apply pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedItems = filteredItems.slice(startIndex, endIndex);

  // Calculate pagination metadata
  const totalItems = filteredItems.length;
  const totalPages = Math.ceil(totalItems / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return NextResponse.json({
    items: paginatedItems,
    pagination: {
      page: page,
      limit: limit,
      total: totalItems,
      totalPages,
      hasNextPage,
      hasPrevPage,
      hasMore: hasNextPage
    },
    filters: {
      search,
      tags,
      source,
      author,
      dateRange
    }
  });
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, source, channel, tags, summary, actionItems, decisions, participants, originalUrl } = body;

    // Validate required fields
    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    try {
      // Get user's organization
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { 
          organizations: {
            include: { organization: true }
          }
        }
      });

      if (!user || user.organizations.length === 0) {
        return NextResponse.json(
          { error: 'User not associated with any organization' },
          { status: 403 }
        );
      }

      const organizationId = user.organizations[0].organizationId;

      // Create new knowledge item
      const newItem = await prisma.knowledgeItem.create({
        data: {
          organizationId: organizationId,
          title: title,
          content: content,
          sourceType: source,
          channelId: channel,
          createdById: user.id,
          summary: summary || null,
          actionItems: actionItems || [],
        }
      });

      return NextResponse.json(newItem, { status: 201 });

    } catch (dbError) {
      console.error('Database error creating knowledge item:', dbError);
      return NextResponse.json(
        { error: 'Failed to create knowledge item' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Knowledge POST API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

