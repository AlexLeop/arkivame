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

    const integrations = await prisma.integration.findMany({
      where: { organizationId: organization.id },
    });

    const integrationStatus = integrations.reduce((acc, integration) => {
      acc[integration.name.toLowerCase()] = integration.isActive ? 'connected' : 'disconnected';
      return acc;
    }, {} as Record<string, string>);

    return NextResponse.json(integrationStatus);
  } catch (error) {
    console.error('Error fetching integrations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}