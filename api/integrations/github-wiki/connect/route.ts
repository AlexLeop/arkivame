
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const organizationId = request.nextUrl.searchParams.get('organizationId');
  if (!organizationId) {
    return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
  }

  const githubClientId = process.env.GITHUB_CLIENT_ID;
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/integrations/github-wiki/callback`;
  const scope = 'repo,workflow'; // Scope for repository access

  const authUrl = `https://github.com/login/oauth/authorize?client_id=${githubClientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${organizationId}`;

  return NextResponse.redirect(authUrl);
}
