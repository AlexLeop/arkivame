
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';

export interface AnalyticsEventProperties {
  [key: string]: any;
}

export async function trackEvent(
  event: string,
  properties: AnalyticsEventProperties = {},
  organizationId?: string,
  userId?: string
) {
  try {
    const headersList = headers();
    const userAgent = headersList.get('user-agent');
    const forwardedFor = headersList.get('x-forwarded-for');
    const realIp = headersList.get('x-real-ip');
    const ipAddress = forwardedFor?.split(',')[0] || realIp || 'unknown';
    const referrer = headersList.get('referer');

    await prisma.analyticsEvent.create({
      data: {
        event,
        properties,
        organizationId,
        userId,
        userAgent,
        ipAddress,
        referrer,
        sessionId: properties.sessionId as string,
      },
    });
  } catch (error) {
    console.error('Failed to track event:', error);
  }
}

export async function trackSearch(
  query: string,
  resultsCount: number,
  organizationId: string,
  userId?: string,
  clickedResult?: string,
  filters: any = {},
  sortBy?: string
) {
  try {
    await prisma.searchQuery.create({
      data: {
        query,
        resultsCount,
        clickedResult,
        organizationId,
        userId,
        filters,
        sortBy,
      },
    });
  } catch (error) {
    console.error('Failed to track search:', error);
  }
}

export async function getAnalytics(organizationId: string, period: 'day' | 'week' | 'month' = 'week') {
  const now = new Date();
  let startDate = new Date();

  switch (period) {
    case 'day':
      startDate.setDate(now.getDate() - 1);
      break;
    case 'week':
      startDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(now.getMonth() - 1);
      break;
  }

  const [
    totalKnowledge,
    totalSearches,
    totalUsers,
    recentActivity,
    topSearchTerms,
    mostViewedItems
  ] = await Promise.all([
    // Total knowledge items
    prisma.knowledgeItem.count({
      where: { organizationId, createdAt: { gte: startDate } }
    }),

    // Total searches
    prisma.searchQuery.count({
      where: { organizationId, timestamp: { gte: startDate } }
    }),

    // Active users
    prisma.analyticsEvent.findMany({
      where: {
        organizationId,
        timestamp: { gte: startDate },
        userId: { not: null }
      },
      select: { userId: true },
      distinct: ['userId']
    }).then(users => users.length),

    // Recent activity events
    prisma.analyticsEvent.findMany({
      where: { organizationId, timestamp: { gte: startDate } },
      select: { event: true },
      take: 100
    }),

    // Top search terms
    prisma.searchQuery.groupBy({
      by: ['query'],
      where: { organizationId, timestamp: { gte: startDate } },
      _count: { query: true },
      orderBy: { _count: { query: 'desc' } },
      take: 10
    }),

    // Most viewed knowledge items
    prisma.knowledgeItem.findMany({
      where: { organizationId, lastViewedAt: { gte: startDate } },
      orderBy: { viewCount: 'desc' },
      select: { id: true, title: true, viewCount: true },
      take: 10
    })
  ]);

  return {
    totalKnowledge,
    totalSearches,
    totalUsers,
    recentActivity: recentActivity.reduce((acc, event) => {
      acc[event.event] = (acc[event.event] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    topSearchTerms: topSearchTerms.map(item => ({
      query: item.query,
      count: item._count.query
    })),
    mostViewedItems
  };
}
