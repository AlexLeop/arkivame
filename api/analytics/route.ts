import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organization = session.user.organizations?.[0];
    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const orgId = organization.id;

    // 1. Overview Metrics
    const totalKnowledge = await prisma.knowledgeItem.count({
      where: { organizationId: orgId },
    });

    const totalTags = await prisma.tag.count({
      where: { organizationId: orgId },
    });

    const activeUsers = await prisma.organizationUser.count({
      where: { organizationId: orgId, isActive: true },
    });

    const monthlyViews = await prisma.knowledgeItem.aggregate({
      where: {
        organizationId: orgId,
        lastViewedAt: {
          gte: new Date(new Date().setMonth(new Date().getMonth() - 1)),
        },
      },
      _sum: {
        viewCount: true,
      },
    });

    // 2. Usage (last 7 days)
    const usage = await Promise.all(
      Array.from({ length: 7 }).map(async (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const day = date.toLocaleDateString('en-US', { weekday: 'short' });
        
        const views = await prisma.analyticsEvent.count({
          where: {
            organizationId: orgId,
            event: 'knowledge_viewed',
            timestamp: {
              gte: new Date(date.setHours(0, 0, 0, 0)),
              lt: new Date(date.setHours(23, 59, 59, 999)),
            },
          },
        });
        return { day, views };
      })
    ).then(days => days.reverse());

    // 3. Source Breakdown
    const sourceBreakdownResult = await prisma.knowledgeItem.groupBy({
      by: ['sourceType'],
      _count: {
        _all: true,
      },
      where: { organizationId: orgId },
    });
    const sourceBreakdown = sourceBreakdownResult.reduce((acc, curr) => {
      acc[curr.sourceType] = curr._count._all;
      return acc;
    }, {} as Record<string, number>);

    // 4. Top Tags
    const topTags = await prisma.tag.findMany({
      where: { organizationId: orgId },
      orderBy: { usageCount: 'desc' },
      take: 5,
      select: { name: true, usageCount: true },
    });

    // 5. Recent Activity
    const recentActivity = await prisma.analyticsEvent.findMany({
      where: { organizationId: orgId },
      orderBy: { timestamp: 'desc' },
      take: 5,
      select: {
        event: true,
        properties: true,
        timestamp: true,
      },
    });

    const analytics = {
      overview: {
        totalKnowledge,
        totalTags,
        activeUsers,
        monthlyViews: monthlyViews._sum.viewCount || 0,
      },
      usage,
      sourceBreakdown,
      topTags: topTags.map(tag => ({ name: tag.name, count: tag.usageCount })),
      recentActivity: recentActivity.map(act => ({
        type: act.event,
        user: (act.properties as any)?.userName || 'System',
        item: (act.properties as any)?.knowledgeItemTitle || 'N/A',
        timestamp: act.timestamp.toISOString(),
      })),
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