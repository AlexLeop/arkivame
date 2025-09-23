
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const organizationId = request.nextUrl.searchParams.get('organizationId');
  if (!organizationId) {
    return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
  }

  const confluenceClientId = process.env.CONFLUENCE_CLIENT_ID;
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/integrations/confluence/callback`;
  const scope = 'read:confluence-space.summary write:confluence-content'; // Adjust scope as needed

  const authUrl = `https://auth.atlassian.com/authorize?audience=api.atlassian.com&client_id=${confluenceClientId}&scope=${encodeURIComponent(scope)}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${organizationId}&response_type=code&prompt=consent`;

  return NextResponse.redirect(authUrl);
}
