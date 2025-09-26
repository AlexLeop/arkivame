import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Sample analytics data
    const stats = {
      totalKnowledge: 127,
      totalTags: 45,
      activeUsers: 23,
      monthlyViews: 1456,
      weeklyGrowth: 12,
      popularTags: [
        { name: 'planning', count: 34 },
        { name: 'engineering', count: 28 },
        { name: 'design', count: 22 },
        { name: 'security', count: 18 },
        { name: 'performance', count: 15 }
      ],
      sourceBreakdown: {
        SLACK: 68,
        TEAMS: 43,
        MANUAL: 16
      },
      weeklyActivity: [
        { day: 'Mon', views: 145 },
        { day: 'Tue', views: 203 },
        { day: 'Wed', views: 189 },
        { day: 'Thu', views: 234 },
        { day: 'Fri', views: 178 },
        { day: 'Sat', views: 67 },
        { day: 'Sun', views: 89 }
      ]
    };

    return NextResponse.json({ stats });

  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}