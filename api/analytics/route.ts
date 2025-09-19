
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

    // Mock organization analytics data
    const analytics = {
      overview: {
        totalKnowledge: 142,
        totalTags: 28,
        activeUsers: 25,
        monthlyViews: 1247
      },
      usage: [
        { day: 'Mon', views: 145 },
        { day: 'Tue', views: 203 },
        { day: 'Wed', views: 189 },
        { day: 'Thu', views: 234 },
        { day: 'Fri', views: 178 },
        { day: 'Sat', views: 67 },
        { day: 'Sun', views: 89 }
      ],
      sourceBreakdown: {
        SLACK: 67,
        TEAMS: 45,
        MANUAL: 30
      },
      topTags: [
        { name: 'engineering', count: 34 },
        { name: 'design', count: 28 },
        { name: 'planning', count: 22 },
        { name: 'security', count: 18 },
        { name: 'performance', count: 15 }
      ],
      recentActivity: [
        {
          type: 'knowledge_created',
          user: 'Sarah Chen',
          item: 'Database Migration Best Practices',
          timestamp: '2024-01-15T10:30:00Z'
        },
        {
          type: 'knowledge_viewed',
          user: 'Mike Johnson', 
          item: 'API Security Guidelines',
          timestamp: '2024-01-15T09:45:00Z'
        },
        {
          type: 'knowledge_bookmarked',
          user: 'David Kim',
          item: 'React Performance Optimization',
          timestamp: '2024-01-15T08:20:00Z'
        }
      ]
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Analytics fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
