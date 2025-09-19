
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

// Sample knowledge data for demonstration
const sampleKnowledgeItems = [
  {
    id: '1',
    title: 'Project Alpha Planning Discussion',
    content: 'We discussed the initial requirements for Project Alpha, including timeline, resources, and key milestones. The team agreed on a 6-month development cycle.',
    source: 'SLACK' as const,
    channel: '#project-alpha',
    author: 'Sarah Chen',
    tags: ['planning', 'project-alpha', 'timeline'],
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(), // 1 day ago
    views: 45,
    bookmarked: true
  },
  {
    id: '2',
    title: 'Database Migration Best Practices',
    content: 'Key points from our database migration discussion: always backup before migration, test on staging first, monitor performance during rollout, have rollback plan ready.',
    source: 'TEAMS' as const,
    channel: 'Engineering Team',
    author: 'Mike Johnson',
    tags: ['database', 'migration', 'best-practices', 'engineering'],
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(), // 5 days ago
    updatedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    views: 78,
    bookmarked: false
  },
  {
    id: '3',
    title: 'Customer Feedback Analysis Q3',
    content: 'Summary of Q3 customer feedback: 85% satisfaction rate, main request for better mobile experience, integration with third-party tools highly requested.',
    source: 'MANUAL' as const,
    channel: 'Manual Entry',
    author: 'Lisa Wang',
    tags: ['customer-feedback', 'q3', 'mobile', 'integrations'],
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(), // 1 week ago
    updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(), // 3 days ago
    views: 32,
    bookmarked: true
  },
  {
    id: '4',
    title: 'Security Audit Findings',
    content: 'Security team completed audit of authentication system. Found minor vulnerabilities in session management. Recommendations: implement CSP headers, upgrade dependencies.',
    source: 'SLACK' as const,
    channel: '#security',
    author: 'David Kim',
    tags: ['security', 'audit', 'authentication', 'vulnerabilities'],
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(), // 10 days ago
    updatedAt: new Date(Date.now() - 86400000 * 8).toISOString(), // 8 days ago
    views: 156,
    bookmarked: false
  },
  {
    id: '5',
    title: 'UI Design System Updates',
    content: 'Updated design system with new color palette, typography scale, and component variants. All teams should use the new design tokens in upcoming projects.',
    source: 'TEAMS' as const,
    channel: 'Design Team',
    author: 'Emma Rodriguez',
    tags: ['design', 'ui', 'design-system', 'tokens'],
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(), // 3 days ago
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(), // 1 day ago
    views: 89,
    bookmarked: true
  },
  {
    id: '6',
    title: 'Performance Optimization Results',
    content: 'After implementing lazy loading and code splitting, page load times improved by 40%. Bundle size reduced from 2.5MB to 1.2MB. User engagement metrics show positive trend.',
    source: 'SLACK' as const,
    channel: '#frontend',
    author: 'Tom Wilson',
    tags: ['performance', 'optimization', 'lazy-loading', 'bundle-size'],
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(), // 4 days ago
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
    views: 67,
    bookmarked: false
  }
];

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // In a real app, you would filter by organization and apply pagination
    return NextResponse.json({
      items: sampleKnowledgeItems,
      total: sampleKnowledgeItems.length,
      page: 1,
      limit: 10
    });

  } catch (error) {
    console.error('Knowledge API error:', error);
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
    const { title, content, source = 'MANUAL', channel, tags = [] } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    // In a real app, you would save to database
    const newItem = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      content,
      source,
      channel: channel || 'Manual Entry',
      author: session.user.name || 'Unknown',
      tags: Array.isArray(tags) ? tags : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      views: 0,
      bookmarked: false
    };

    return NextResponse.json(newItem, { status: 201 });

  } catch (error) {
    console.error('Knowledge POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
