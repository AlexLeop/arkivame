
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/encryption';
import { NotionOutputIntegration } from '@/lib/integrations/notion-output';
import { ConfluenceOutputIntegration } from '@/lib/integrations/confluence-output';

interface RouteParams {
  params: { id: string };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { platform } = await request.json();

    // Get knowledge item
    const knowledge = await prisma.knowledgeItem.findUnique({
      where: { id: params.id },
      include: { 
        organization: true,
        tags: {
          include: { tag: true }
        }
      }
    });

    if (!knowledge) {
      return NextResponse.json({ error: 'Knowledge item not found' }, { status: 404 });
    }

    // Verify user has access to organization
    const orgUser = await prisma.organizationUser.findUnique({
      where: {
        organizationId_userId: {
          organizationId: knowledge.organizationId,
          userId: session.user.id
        }
      }
    });

    if (!orgUser) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get integration configuration
    const integrationMapping: Record<string, string> = {
      'notion': 'NOTION_OUT',
      'confluence': 'CONFLUENCE',
      'coda': 'CODA',
      'clickup': 'CLICKUP_DOCS',
      'google-docs': 'GOOGLE_DOCS',
      'dropbox-paper': 'DROPBOX_PAPER',
      'guru': 'GURU',
      'bookstack': 'BOOKSTACK',
      'github-wiki': 'GITHUB_WIKI'
    };

    const integrationType = integrationMapping[platform];
    if (!integrationType) {
      return NextResponse.json({ error: 'Unsupported platform' }, { status: 400 });
    }

    const integration = await prisma.integration.findFirst({
      where: {
        organizationId: knowledge.organizationId,
        type: integrationType,
        isActive: true
      }
    });

    if (!integration) {
      return NextResponse.json({ 
        error: `${platform} integration not configured` 
      }, { status: 400 });
    }

    // Decrypt credentials
    const credentials = Object.entries(integration.credentials).reduce((acc, [key, value]) => {
      acc[key] = decrypt(value);
      return acc;
    }, {} as Record<string, string>);

    // Export knowledge
    let result;
    const tags = knowledge.tags.map(ta => ta.tag.name);

    switch (integrationType) {
      case 'NOTION_OUT': {
        const notionIntegration = new NotionOutputIntegration({
          type: integrationType,
          credentials,
          settings: integration.config
        });
        result = await notionIntegration.exportKnowledge(
          knowledge.title,
          knowledge.content as any[],
          tags
        );
        break;
      }
      case 'CONFLUENCE': {
        const confluenceIntegration = new ConfluenceOutputIntegration({
          type: integrationType,
          credentials,
          settings: integration.config
        });
        result = await confluenceIntegration.exportKnowledge(
          knowledge.title,
          knowledge.content as any[],
          tags
        );
        break;
      }
      // Add more cases for other platforms as needed
      default:
        return NextResponse.json({ 
          error: `Export to ${platform} not yet implemented` 
        }, { status: 501 });
    }

    if (result.success) {
      // Update knowledge item with export information
      await prisma.knowledgeItem.update({
        where: { id: params.id },
        data: {
          sourceMetadata: {
            ...(knowledge.sourceMetadata as any),
            exports: {
              ...((knowledge.sourceMetadata as any)?.exports || {}),
              [platform]: {
                exportedAt: new Date().toISOString(),
                externalId: result.externalId,
                url: result.url,
              }
            }
          }
        }
      });

      return NextResponse.json({
        success: true,
        platform,
        externalId: result.externalId,
        url: result.url
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Error exporting knowledge:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
