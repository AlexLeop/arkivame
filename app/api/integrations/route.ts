import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth-config';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    // In a real application, you would fetch the actual connection status
    // of each integration for the given organization from your database.
    // For this example, we'll simulate some statuses.
    const integrationsStatus = {
      slack: 'disconnected',
      discord: 'connected',
      'google-chat': 'disconnected',
      mattermost: 'disconnected',
      notion: 'disconnected',
      confluence: 'disconnected',
      'google-docs': 'disconnected',
      'github-wiki': 'disconnected',
    };

    // Fetch actual integration statuses from DB if available
    const connectedIntegrations = await prisma.integration.findMany({
      where: { organizationId },
      select: { type: true, isActive: true },
    });

    connectedIntegrations.forEach(integration => {
      if (integration.type === 'SLACK') integrationsStatus.slack = integration.isActive ? 'connected' : 'disconnected';
      if (integration.type === 'DISCORD') integrationsStatus.discord = integration.isActive ? 'connected' : 'disconnected';
      // Add other integrations as needed
    });

    return NextResponse.json(integrationsStatus);
  } catch (error) {
    console.error('Error fetching integrations status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


