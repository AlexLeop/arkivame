import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const totalOrganizations = await prisma.organization.count();
    const activeUsers = await prisma.user.count({ where: { isActive: true } });
    const totalKnowledge = await prisma.knowledgeItem.count();

    // Calculate monthly growth (example: new organizations in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newOrganizationsLastMonth = await prisma.organization.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    });
    const monthlyGrowth = totalOrganizations > 0 ? (newOrganizationsLastMonth / totalOrganizations) * 100 : 0;

    const overview = {
      totalOrganizations,
      activeUsers,
      totalKnowledge,
      monthlyGrowth: parseFloat(monthlyGrowth.toFixed(2)),
    };

    return NextResponse.json({ overview });
  } catch (error) {
    console.error('Error fetching super admin analytics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}