
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import axios from 'axios';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const organizationId = request.nextUrl.searchParams.get('state');

  if (!code || !organizationId) {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/${organizationId}/integrations?error=notion_auth_failed`);
  }

  try {
    const notionClientId = process.env.NOTION_CLIENT_ID!;
    const notionClientSecret = process.env.NOTION_CLIENT_SECRET!;
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/integrations/notion/callback`;

    const authString = Buffer.from(`${notionClientId}:${notionClientSecret}`).toString('base64');

    const tokenResponse = await axios.post('https://api.notion.com/v1/oauth/token', {
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirectUri,
    }, {
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/json',
      },
    });

    const { access_token, workspace_id, workspace_name } = tokenResponse.data;

    await prisma.integration.upsert({
      where: {
        organizationId_name: { organizationId, name: 'Notion' },
      },
      update: {
        credentials: { accessToken: access_token },
        config: { workspaceId: workspace_id, workspaceName: workspace_name },
        isActive: true,
      },
      create: {
        organizationId: organizationId,
        name: 'Notion',
        type: 'NOTION_OUT',
        credentials: { accessToken: access_token },
        config: { workspaceId: workspace_id, workspaceName: workspace_name },
        isActive: true,
      },
    });

    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/${organizationId}/integrations?success=notion_connected`);
  } catch (error) {
    console.error('Notion OAuth error:', error);
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/${organizationId}/integrations?error=notion_auth_failed`);
  }
}
