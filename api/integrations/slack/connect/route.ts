
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const organizationId = request.nextUrl.searchParams.get('organizationId');
  if (!organizationId) {
    return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
  }

  const slackClientId = process.env.SLACK_CLIENT_ID;
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/integrations/slack/callback`;
  const scope = 'channels:read,chat:write,commands,im:history,im:read,im:write,users:read';

  const authUrl = `https://slack.com/oauth/v2/authorize?client_id=${slackClientId}&scope=${scope}&redirect_uri=${redirectUri}&state=${organizationId}`;

  return NextResponse.redirect(authUrl);
}
