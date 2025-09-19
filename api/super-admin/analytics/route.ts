
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Mock analytics data
    const analytics = {
      overview: {
        totalOrganizations: 12,
        activeUsers: 247,
        totalKnowledge: 1456,
        monthlyGrowth: 18.5
      },
      growth: [
        { month: 'Jan', count: 8 },
        { month: 'Feb', count: 9 },
        { month: 'Mar', count: 10 },
        { month: 'Apr', count: 11 },
        { month: 'May', count: 11 },
        { month: 'Jun', count: 12 }
      ],
      planDistribution: {
        FREE: 3,
        STARTER: 5,
        BUSINESS: 3,
        ENTERPRISE: 1
      },
      userActivity: [
        { date: '2024-01-15', activeUsers: 89 },
        { date: '2024-01-14', activeUsers: 76 },
        { date: '2024-01-13', activeUsers: 92 },
        { date: '2024-01-12', activeUsers: 85 },
        { date: '2024-01-11', activeUsers: 78 }
      ],
      topOrganizations: [
        { name: 'Global Solutions', userCount: 150, knowledgeCount: 891 },
        { name: 'Acme Corporation', userCount: 25, knowledgeCount: 142 },
        { name: 'TechStart Inc', userCount: 8, knowledgeCount: 67 }
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
