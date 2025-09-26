import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const { platform } = await request.json();

    // Get user and organization
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { organizations: true }
    });

    if (!user || user.organizations.length === 0) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const organizationId = user.organizations[0].id;

    // Get the knowledge item
    const knowledgeItem = await prisma.knowledgeItem.findFirst({
      where: {
        id,
        organizationId
      }
    });

    if (!knowledgeItem) {
      return NextResponse.json({ error: 'Knowledge item not found' }, { status: 404 });
    }

    // In a real implementation, this would integrate with the respective platform APIs
    // For now, we'll just simulate the export process
    
    let exportUrl = '';
    let exportResult = {};

    switch (platform) {
      case 'notion':
        // Simulate Notion export
        exportUrl = `https://notion.so/exported-${id}`;
        exportResult = {
          platform: 'Notion',
          url: exportUrl,
          status: 'success',
          message: 'Successfully exported to Notion'
        };
        break;

      case 'confluence':
        // Simulate Confluence export
        exportUrl = `https://company.atlassian.net/wiki/spaces/KB/pages/${id}`;
        exportResult = {
          platform: 'Confluence',
          url: exportUrl,
          status: 'success',
          message: 'Successfully exported to Confluence'
        };
        break;

      case 'google-docs':
        // Simulate Google Docs export
        exportUrl = `https://docs.google.com/document/d/${id}`;
        exportResult = {
          platform: 'Google Docs',
          url: exportUrl,
          status: 'success',
          message: 'Successfully exported to Google Docs'
        };
        break;

      case 'github':
        // Simulate GitHub Wiki export
        exportUrl = `https://github.com/company/wiki/wiki/${knowledgeItem.title.replace(/\s+/g, '-')}`;
        exportResult = {
          platform: 'GitHub Wiki',
          url: exportUrl,
          status: 'success',
          message: 'Successfully exported to GitHub Wiki'
        };
        break;

      default:
        return NextResponse.json({ error: 'Unsupported platform' }, { status: 400 });
    }

    // Log the export activity (in a real implementation)
    console.log(`Exported knowledge item ${id} to ${platform}:`, exportResult);

    return NextResponse.json(exportResult);
  } catch (error) {
    console.error('Error exporting knowledge item:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

