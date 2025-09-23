
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const organizationId = request.nextUrl.searchParams.get('organizationId');
  if (!organizationId) {
    return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
  }

  const mattermostUrl = process.env.MATTERMOST_URL;
  const mattermostClientId = process.env.MATTERMOST_CLIENT_ID;
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/integrations/mattermost/callback`;

  const authUrl = `${mattermostUrl}/oauth/authorize?client_id=${mattermostClientId}&response_type=code&redirect_uri=${redirectUri}&state=${organizationId}`;

  return NextResponse.redirect(authUrl);
}
