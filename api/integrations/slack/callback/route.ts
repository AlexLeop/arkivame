
import { NextRequest, NextResponse } from 'next/server';
import { WebClient } from '@slack/web-api';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const organizationId = request.nextUrl.searchParams.get('state');

  if (!code || !organizationId) {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/${organizationId}/integrations?error=slack_auth_failed`);
  }

  try {
    const slackClient = new WebClient();
    const oauthResponse = await slackClient.oauth.v2.access({
      client_id: process.env.SLACK_CLIENT_ID!,
      client_secret: process.env.SLACK_CLIENT_SECRET!,
      code: code,
      redirect_uri: `${process.env.NEXTAUTH_URL}/api/integrations/slack/callback`,
    });

    if (!oauthResponse.ok) {
      throw new Error(oauthResponse.error);
    }

    const { access_token, team } = oauthResponse as any;

    await prisma.integration.upsert({
      where: {
        organizationId_name: { organizationId, name: 'Slack' },
      },
      update: {
        credentials: { accessToken: access_token },
        config: { teamId: team.id, teamName: team.name },
        isActive: true,
      },
      create: {
        organizationId: organizationId,
        name: 'Slack',
        type: 'SLACK',
        credentials: { accessToken: access_token },
        config: { teamId: team.id, teamName: team.name },
        isActive: true,
      },
    });

    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/${organizationId}/integrations?success=slack_connected`);
  } catch (error) {
    console.error('Slack OAuth error:', error);
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/${organizationId}/integrations?error=slack_auth_failed`);
  }
}
