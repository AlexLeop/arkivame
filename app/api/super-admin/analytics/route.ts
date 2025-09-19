
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Real system-wide analytics from the database
    const totalOrganizations = await prisma.organization.count();
    const activeUsers = await prisma.user.count({ where: { isActive: true } });
    const totalKnowledge = await prisma.knowledgeItem.count();

    const planDistribution = await prisma.organization.groupBy({
      by: ['plan'],
      _count: { _all: true },
    });

    const statusDistribution = await prisma.organization.groupBy({
      by: ['status'],
      _count: { _all: true },
    });

    const stats = {
      totalOrganizations,
      activeUsers,
      totalKnowledge,
      planDistribution: planDistribution.reduce((acc, item) => {
        acc[item.plan] = item._count._all;
        return acc;
      }, {} as Record<string, number>),
      statusDistribution: statusDistribution.reduce((acc, item) => {
        acc[item.status] = item._count._all;
        return acc;
      }, {} as Record<string, number>),
      // The following are still placeholders as they require more complex logic
      systemMetrics: {
        uptime: 99.9,
        avgResponseTime: 245, // ms
      }
    };

    return NextResponse.json({ stats });

  } catch (error) {
    console.error('Super admin analytics API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
