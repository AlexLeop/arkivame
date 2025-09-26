
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../lib/auth-config';

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
    const type = searchParams.get('type') || 'all';
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Mock activity data
    let activities = [
      {
        id: '1',
        type: 'knowledge_created',
        action: 'created',
        resource: 'knowledge',
        resourceId: '1',
        resourceTitle: 'Database Migration Best Practices',
        user: {
          id: '1',
          name: 'Sarah Chen',
          email: 'sarah@acme.com',
          avatar: null
        },
        metadata: {
          source: 'MANUAL',
          tags: ['database', 'migration']
        },
        timestamp: '2024-01-15T10:30:00Z',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0...'
      },
      {
        id: '2',
        type: 'knowledge_viewed',
        action: 'viewed',
        resource: 'knowledge',
        resourceId: '2',
        resourceTitle: 'API Security Guidelines',
        user: {
          id: '2',
          name: 'Mike Johnson',
          email: 'mike@acme.com',
          avatar: null
        },
        metadata: {
          duration: 120, // seconds
          source: 'search'
        },
        timestamp: '2024-01-15T10:15:00Z',
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0...'
      },
      {
        id: '3',
        type: 'user_login',
        action: 'login',
        resource: 'session',
        resourceId: null,
        resourceTitle: null,
        user: {
          id: '3',
          name: 'David Kim',
          email: 'david@acme.com',
          avatar: null
        },
        metadata: {
          success: true,
          method: 'password'
        },
        timestamp: '2024-01-15T09:45:00Z',
        ipAddress: '192.168.1.102',
        userAgent: 'Mozilla/5.0...'
      },
      {
        id: '4',
        type: 'knowledge_bookmarked',
        action: 'bookmarked',
        resource: 'knowledge',
        resourceId: '1',
        resourceTitle: 'Database Migration Best Practices',
        user: {
          id: '2',
          name: 'Mike Johnson',
          email: 'mike@acme.com',
          avatar: null
        },
        metadata: {},
        timestamp: '2024-01-15T09:30:00Z',
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0...'
      },
      {
        id: '5',
        type: 'knowledge_commented',
        action: 'commented',
        resource: 'knowledge',
        resourceId: '2',
        resourceTitle: 'API Security Guidelines',
        user: {
          id: '3',
          name: 'David Kim',
          email: 'david@acme.com',
          avatar: null
        },
        metadata: {
          commentId: 'comment-123',
          preview: 'This is really helpful! Thanks for sharing...'
        },
        timestamp: '2024-01-15T08:20:00Z',
        ipAddress: '192.168.1.102',
        userAgent: 'Mozilla/5.0...'
      }
    ];

    // Apply filters
    if (type !== 'all') {
      activities = activities.filter(activity => activity.type === type);
    }

    if (userId) {
      activities = activities.filter(activity => activity.user.id === userId);
    }

    // Pagination
    const paginatedActivities = activities.slice(offset, offset + limit);

    return NextResponse.json({
      data: paginatedActivities,
      total: activities.length,
      limit,
      offset,
      summary: {
        totalUsers: 25,
        totalActions: activities.length,
        mostActiveUser: 'Sarah Chen',
        mostCommonAction: 'knowledge_viewed'
      }
    });
  } catch (error) {
    console.error('Activity fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
