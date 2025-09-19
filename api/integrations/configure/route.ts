
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/encryption';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { organizationId, type, name, credentials, config } = await request.json();

    // Verify user has access to organization
    const orgUser = await prisma.organizationUser.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId: session.user.id
        }
      }
    });

    if (!orgUser || !['OWNER', 'ADMIN'].includes(orgUser.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Encrypt sensitive credentials
    const encryptedCredentials = Object.entries(credentials).reduce((acc, [key, value]) => {
      acc[key] = encrypt(value as string);
      return acc;
    }, {} as Record<string, string>);

    // Create or update integration
    const integration = await prisma.integration.upsert({
      where: {
        organizationId_type: {
          organizationId,
          type
        }
      },
      update: {
        name,
        credentials: encryptedCredentials,
        config,
        isActive: true,
      },
      create: {
        organizationId,
        type,
        name,
        credentials: encryptedCredentials,
        config,
        isActive: true,
      }
    });

    // Test the integration
    let testResult = false;
    try {
      testResult = await testIntegration(type, credentials, config);
    } catch (error) {
      console.error('Integration test failed:', error);
    }

    return NextResponse.json({
      integration: {
        id: integration.id,
        type: integration.type,
        name: integration.name,
        isActive: integration.isActive,
        testResult,
      }
    });

  } catch (error) {
    console.error('Error configuring integration:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function testIntegration(type: string, credentials: any, config: any): Promise<boolean> {
  switch (type) {
    case 'SLACK': {
      const { SlackIntegration } = await import('@/lib/integrations/slack');
      const integration = new SlackIntegration({ type, credentials, config });
      return await integration.testConnection();
    }
    case 'DISCORD': {
      const { DiscordIntegration } = await import('@/lib/integrations/discord');
      const integration = new DiscordIntegration({ type, credentials, config });
      return await integration.testConnection();
    }
    case 'NOTION_OUT': {
      const { NotionOutputIntegration } = await import('@/lib/integrations/notion-output');
      const integration = new NotionOutputIntegration({ type, credentials, config });
      return await integration.testConnection();
    }
    case 'CONFLUENCE': {
      const { ConfluenceOutputIntegration } = await import('@/lib/integrations/confluence-output');
      const integration = new ConfluenceOutputIntegration({ type, credentials, config });
      return await integration.testConnection();
    }
    default:
      return false;
  }
}
