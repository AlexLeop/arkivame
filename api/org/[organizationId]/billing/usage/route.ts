
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { PLANS } from '@/lib/stripe';

export async function GET(request: NextRequest, { params }: { params: { organizationId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organization = await prisma.organization.findUnique({
      where: { id: params.organizationId },
      include: { subscription: true },
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const currentPlan = organization.subscription?.plan || 'FREE';
    const planLimits = PLANS[currentPlan as keyof typeof PLANS].limits;

    const usersCount = await prisma.organizationUser.count({
      where: { organizationId: params.organizationId, isActive: true },
    });

    const knowledgeItemsCount = await prisma.knowledgeItem.count({
      where: { organizationId: params.organizationId },
    });

    const integrationsCount = await prisma.integration.count({
      where: { organizationId: params.organizationId, isActive: true },
    });

    // Calculate storage usage by summing the size of the content field for each knowledge item
    const knowledgeItems = await prisma.knowledgeItem.findMany({
      where: { organizationId: params.organizationId },
      select: { content: true },
    });

    let totalContentSize = 0;
    for (const item of knowledgeItems) {
      if (item.content) {
        // Convert JSON content to string and get its length in bytes (approx)
        totalContentSize += JSON.stringify(item.content).length;
      }
    }
    const storageGB = totalContentSize / (1024 * 1024 * 1024);

    const usageData = {
      plan: currentPlan,
      usage: {
        users: { current: usersCount, limit: planLimits.users },
        archivements: { current: knowledgeItemsCount, limit: planLimits.archives },
        integrations: { current: integrationsCount, limit: planLimits.integrations },
        storage: { current: parseFloat(storageGB.toFixed(2)), limit: planLimits.storage },
      },
    };

    return NextResponse.json(usageData);
  } catch (error) {
    console.error('Error fetching usage data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
