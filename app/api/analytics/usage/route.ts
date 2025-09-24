import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current date for calculations
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get organization for the user (simplified - in real app you'd get from params)
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { organizations: true }
    });

    if (!user || user.organizations.length === 0) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const organizationId = user.organizations[0].id;

    // Fetch overview data
    const [
      totalUsers,
      totalKnowledgeItems,
      recentKnowledgeItems,
      weeklyKnowledgeItems
    ] = await Promise.all([
      // Count total users in organization
      prisma.user.count({
        where: {
          organizations: {
            some: { id: organizationId }
          }
        }
      }),
      
      // Count total knowledge items
      prisma.knowledgeItem.count({
        where: { organizationId }
      }),
      // Count knowledge items from last 30 days
      prisma.knowledgeItem.count({
        where: {
          organizationId,
          createdAt: { gte: thirtyDaysAgo }
        }
      }),
      
      // Count knowledge items from last 7 days
      prisma.knowledgeItem.count({
        where: {
          organizationId,
          createdAt: { gte: sevenDaysAgo }
        }
      })
    ]);

    // Calculate storage in GB (simplified calculation, assuming 0.1MB per item)
    const storageGB = (totalKnowledgeItems * 0.1) / 1024;

    // Calculate growth percentages (simplified)
    const itemsGrowth = totalKnowledgeItems > 0 ? 
      ((recentKnowledgeItems / totalKnowledgeItems) * 100) : 0;
    
    const usersGrowth = 8.5; // Placeholder - would need historical data
    const storageGrowth = 12.3; // Placeholder - would need historical data
    const apiCallsGrowth = -2.1; // Placeholder - would need API usage tracking

    // Fetch top users by knowledge items created
    const topUsers = await prisma.user.findMany({
      where: {
        organizations: {
          some: { id: organizationId }
        }
      },
      include: {
        _count: {
          select: {
            createdKnowledge: true
          }
        }
      },
      orderBy: {
                createdKnowledge: {
          _count: 'desc'
        }
      },
      take: 5
    });

    // Fetch top content by views
    const topContent = await prisma.knowledgeItem.findMany({
      where: { organizationId },
      orderBy: { viewCount: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        viewCount: true,
        sourceType: true,
        createdAt: true
      }
    });

    // Generate daily trends for the last 7 days
    const dailyTrends = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));
      
      const dayItems = await prisma.knowledgeItem.count({
        where: {
          organizationId,
          createdAt: {
            gte: dayStart,
            lte: dayEnd
          }
        }
      });

      dailyTrends.push({
        date: dayStart.toISOString().split('T')[0],
        users: totalUsers, // Simplified - would need daily user activity tracking
        storage: storageGB,
        items: dayItems
      });
    }

    // Generate monthly trends (simplified)
    const monthlyTrends = [
      { month: 'Out', users: Math.max(1, totalUsers - 7), storage: Math.max(0.1, storageGB - 2), items: Math.max(0, totalKnowledgeItems - 125) },
      { month: 'Nov', users: Math.max(1, totalUsers - 4), storage: Math.max(0.1, storageGB - 1.1), items: Math.max(0, totalKnowledgeItems - 65) },
      { month: 'Dez', users: Math.max(1, totalUsers - 2), storage: Math.max(0.1, storageGB - 0.4), items: Math.max(0, totalKnowledgeItems - 25) },
      { month: 'Jan', users: totalUsers, storage: storageGB, items: totalKnowledgeItems }
    ];

    const usageData = {
      overview: {
        users: { current: totalUsers, limit: 25, growth: usersGrowth },
        storage: { current: parseFloat(storageGB.toFixed(1)), limit: 10, growth: storageGrowth },
        knowledgeItems: { current: totalKnowledgeItems, limit: 1000, growth: itemsGrowth },
        apiCalls: { current: 8500, limit: 50000, growth: apiCallsGrowth } // Placeholder
      },
      trends: {
        daily: dailyTrends,
        monthly: monthlyTrends
      },
      activity: {
        topUsers: topUsers.map((user: { name: string | null; email: string; _count: { createdKnowledge: number } }) => ({
          name: user.name || 'Unknown User',
          email: user.email,
          items: user._count.createdKnowledge,
          views: 0 // Placeholder - would need view tracking per user
        })),
        topContent: topContent.map((item: {
          title: string;
          viewCount: number;
          sourceType: string;
          createdAt: Date;
        }) => ({
          title: item.title,
          views: item.viewCount,
          source: item.sourceType,
          createdAt: item.createdAt.toISOString().split('T')[0]
        })),
        integrations: [
          { name: 'Slack', usage: 65, status: 'active' },
          { name: 'Microsoft Teams', usage: 35, status: 'active' },
          { name: 'Discord', usage: 15, status: 'active' },
          { name: 'Notion', usage: 8, status: 'inactive' },
          { name: 'Confluence', usage: 5, status: 'inactive' }
        ] // Placeholder - would need integration usage tracking
      }
    };

    return NextResponse.json(usageData);
  } catch (error) {
    console.error('Error fetching usage data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
