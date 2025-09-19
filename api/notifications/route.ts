
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

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
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    // Mock notifications
    let notifications = [
      {
        id: '1',
        type: 'knowledge_shared',
        title: 'New knowledge shared',
        message: 'Sarah Chen shared "Database Migration Best Practices" with your team',
        read: false,
        createdAt: '2024-01-15T10:30:00Z',
        data: { knowledgeId: '1', sharedBy: 'Sarah Chen' }
      },
      {
        id: '2',
        type: 'team_invitation',
        title: 'Team invitation',
        message: 'You have been invited to join the Engineering team',
        read: false,
        createdAt: '2024-01-15T09:15:00Z',
        data: { teamId: 'eng-team', invitedBy: 'Mike Johnson' }
      },
      {
        id: '3',
        type: 'knowledge_commented',
        title: 'New comment',
        message: 'David Kim commented on your knowledge article',
        read: true,
        createdAt: '2024-01-14T16:45:00Z',
        data: { knowledgeId: '2', commentedBy: 'David Kim' }
      },
      {
        id: '4',
        type: 'system_maintenance',
        title: 'System maintenance',
        message: 'Scheduled maintenance will occur tonight from 2AM - 4AM',
        read: true,
        createdAt: '2024-01-14T12:00:00Z',
        data: { maintenanceWindow: '2024-01-15T02:00:00Z to 2024-01-15T04:00:00Z' }
      }
    ];

    // Apply filters
    if (unreadOnly) {
      notifications = notifications.filter(n => !n.read);
    }

    // Pagination
    const paginatedNotifications = notifications.slice(offset, offset + limit);

    return NextResponse.json({
      data: paginatedNotifications,
      total: notifications.length,
      unreadCount: notifications.filter(n => !n.read).length,
      limit,
      offset
    });
  } catch (error) {
    console.error('Notifications fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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
    const { ids, action } = body;

    if (!ids || !Array.isArray(ids) || !action) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    // Mock update notifications
    const updatedNotifications = ids.map(id => ({
      id,
      read: action === 'mark_read',
      updatedAt: new Date().toISOString()
    }));

    return NextResponse.json({
      success: true,
      updated: updatedNotifications.length,
      notifications: updatedNotifications
    });
  } catch (error) {
    console.error('Notifications update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
