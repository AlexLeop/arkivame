
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const organizationId = request.nextUrl.searchParams.get('organizationId');
  if (!organizationId) {
    return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
  }

  const notionClientId = process.env.NOTION_CLIENT_ID;
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/integrations/notion/callback`;

  const authUrl = `https://api.notion.com/v1/oauth/authorize?client_id=${notionClientId}&response_type=code&owner=user&redirect_uri=${redirectUri}&state=${organizationId}`;

  return NextResponse.redirect(authUrl);
}
