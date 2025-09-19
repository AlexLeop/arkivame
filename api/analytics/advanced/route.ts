
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const period = searchParams.get('period') || 'week'; // day, week, month, year
    
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
    }

    // Verify user access
    const orgUser = await prisma.organizationUser.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId: session.user.id
        }
      }
    });

    if (!orgUser) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    let groupBy: 'hour' | 'day' | 'week' | 'month' = 'day';

    switch (period) {
      case 'day':
        startDate.setDate(now.getDate() - 1);
        groupBy = 'hour';
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        groupBy = 'day';
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        groupBy = 'day';
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        groupBy = 'month';
        break;
    }

    // Advanced analytics queries
    const [
      knowledgeGrowth,
      searchTrends,
      userEngagement,
      topPerformingContent,
      integrationUsage,
      tagAnalytics,
      channelActivity
    ] = await Promise.all([
      // Knowledge growth over time
      getKnowledgeGrowth(organizationId, startDate, groupBy),
      
      // Search trends and patterns
      getSearchTrends(organizationId, startDate, groupBy),
      
      // User engagement metrics
      getUserEngagement(organizationId, startDate),
      
      // Top performing content
      getTopPerformingContent(organizationId, startDate),
      
      // Integration usage statistics
      getIntegrationUsage(organizationId, startDate),
      
      // Tag analytics
      getTagAnalytics(organizationId, startDate),
      
      // Channel/source activity
      getChannelActivity(organizationId, startDate)
    ]);

    return NextResponse.json({
      period,
      dateRange: { startDate, endDate: now },
      metrics: {
        knowledgeGrowth,
        searchTrends,
        userEngagement,
        topPerformingContent,
        integrationUsage,
        tagAnalytics,
        channelActivity
      }
    });

  } catch (error) {
    console.error('Error fetching advanced analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function getKnowledgeGrowth(organizationId: string, startDate: Date, groupBy: string) {
  // This would need raw SQL for proper time grouping
  const items = await prisma.knowledgeItem.findMany({
    where: {
      organizationId,
      createdAt: { gte: startDate }
    },
    select: { createdAt: true, sourceType: true }
  });

  // Group by time period
  const grouped = items.reduce((acc, item) => {
    const key = formatDateForGrouping(item.createdAt, groupBy);
    if (!acc[key]) {
      acc[key] = { total: 0, bySource: {} };
    }
    acc[key].total++;
    acc[key].bySource[item.sourceType] = (acc[key].bySource[item.sourceType] || 0) + 1;
    return acc;
  }, {} as Record<string, any>);

  return Object.entries(grouped).map(([date, data]) => ({
    date,
    ...data
  })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

async function getSearchTrends(organizationId: string, startDate: Date, groupBy: string) {
  const searches = await prisma.searchQuery.findMany({
    where: {
      organizationId,
      timestamp: { gte: startDate }
    },
    select: { timestamp: true, query: true, resultsCount: true, clickedResult: true }
  });

  const trends = searches.reduce((acc, search) => {
    const key = formatDateForGrouping(search.timestamp, groupBy);
    if (!acc[key]) {
      acc[key] = { 
        totalSearches: 0, 
        uniqueQueries: new Set(),
        avgResultsCount: 0,
        clickThroughRate: 0,
        clicks: 0
      };
    }
    acc[key].totalSearches++;
    acc[key].uniqueQueries.add(search.query.toLowerCase());
    acc[key].avgResultsCount += search.resultsCount;
    if (search.clickedResult) acc[key].clicks++;
    return acc;
  }, {} as Record<string, any>);

  return Object.entries(trends).map(([date, data]) => ({
    date,
    totalSearches: data.totalSearches,
    uniqueQueries: data.uniqueQueries.size,
    avgResultsCount: data.avgResultsCount / data.totalSearches,
    clickThroughRate: data.clicks / data.totalSearches
  })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

async function getUserEngagement(organizationId: string, startDate: Date) {
  const events = await prisma.analyticsEvent.findMany({
    where: {
      organizationId,
      timestamp: { gte: startDate },
      userId: { not: null }
    },
    select: { userId: true, event: true, timestamp: true }
  });

  const userStats = events.reduce((acc, event) => {
    const userId = event.userId!;
    if (!acc[userId]) {
      acc[userId] = { events: 0, eventTypes: new Set(), sessions: new Set() };
    }
    acc[userId].events++;
    acc[userId].eventTypes.add(event.event);
    // Simple session detection - group events within 30 minutes
    const sessionKey = Math.floor(event.timestamp.getTime() / (30 * 60 * 1000));
    acc[userId].sessions.add(sessionKey);
    return acc;
  }, {} as Record<string, any>);

  const activeUsers = Object.keys(userStats).length;
  const avgEventsPerUser = Object.values(userStats).reduce((sum: number, user: any) => sum + user.events, 0) / activeUsers;
  const avgSessionsPerUser = Object.values(userStats).reduce((sum: number, user: any) => sum + user.sessions.size, 0) / activeUsers;

  return {
    activeUsers,
    avgEventsPerUser,
    avgSessionsPerUser,
    powerUsers: Object.entries(userStats)
      .sort(([,a]: any, [,b]: any) => b.events - a.events)
      .slice(0, 5)
      .map(([userId, stats]: any) => ({ userId, events: stats.events }))
  };
}

async function getTopPerformingContent(organizationId: string, startDate: Date) {
  return await prisma.knowledgeItem.findMany({
    where: {
      organizationId,
      lastViewedAt: { gte: startDate }
    },
    select: {
      id: true,
      title: true,
      viewCount: true,
      searchCount: true,
      createdAt: true,
      sourceType: true,
      channelName: true
    },
    orderBy: [
      { viewCount: 'desc' },
      { searchCount: 'desc' }
    ],
    take: 20
  });
}

async function getIntegrationUsage(organizationId: string, startDate: Date) {
  const integrations = await prisma.integration.findMany({
    where: { organizationId },
    select: { type: true, lastSyncAt: true }
  });

  const knowledgeBySource = await prisma.knowledgeItem.groupBy({
    by: ['sourceType'],
    where: {
      organizationId,
      createdAt: { gte: startDate }
    },
    _count: { sourceType: true }
  });

  return {
    configuredIntegrations: integrations.map(i => ({
      type: i.type,
      isActive: i.lastSyncAt && i.lastSyncAt > new Date(Date.now() - 24 * 60 * 60 * 1000)
    })),
    contentBySource: knowledgeBySource.map(item => ({
      source: item.sourceType,
      count: item._count.sourceType
    }))
  };
}

async function getTagAnalytics(organizationId: string, startDate: Date) {
  const tagUsage = await prisma.tagAssignment.findMany({
    where: {
      knowledgeItem: {
        organizationId,
        createdAt: { gte: startDate }
      }
    },
    include: {
      tag: { select: { name: true, color: true } }
    }
  });

  const tagStats = tagUsage.reduce((acc, assignment) => {
    const tagName = assignment.tag.name;
    if (!acc[tagName]) {
      acc[tagName] = { count: 0, color: assignment.tag.color };
    }
    acc[tagName].count++;
    return acc;
  }, {} as Record<string, any>);

  return Object.entries(tagStats)
    .sort(([,a]: any, [,b]: any) => b.count - a.count)
    .slice(0, 20)
    .map(([name, stats]: any) => ({ name, ...stats }));
}

async function getChannelActivity(organizationId: string, startDate: Date) {
  const channelStats = await prisma.knowledgeItem.groupBy({
    by: ['channelName', 'sourceType'],
    where: {
      organizationId,
      createdAt: { gte: startDate },
      channelName: { not: null }
    },
    _count: { channelName: true },
    _avg: { viewCount: true }
  });

  return channelStats.map(stat => ({
    channel: stat.channelName,
    source: stat.sourceType,
    itemCount: stat._count.channelName,
    avgViews: stat._avg.viewCount || 0
  })).sort((a, b) => b.itemCount - a.itemCount);
}

function formatDateForGrouping(date: Date, groupBy: string): string {
  switch (groupBy) {
    case 'hour':
      return date.toISOString().substring(0, 13) + ':00:00';
    case 'day':
      return date.toISOString().substring(0, 10);
    case 'week':
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      return weekStart.toISOString().substring(0, 10);
    case 'month':
      return date.toISOString().substring(0, 7) + '-01';
    default:
      return date.toISOString().substring(0, 10);
  }
}
