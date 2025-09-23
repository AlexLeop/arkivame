
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const organizationId = request.nextUrl.searchParams.get('organizationId');
  if (!organizationId) {
    return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
  }

  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/integrations/google-chat/callback`;
  const scope = 'https://www.googleapis.com/auth/chat.bot'; // Adjust scope as needed

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleClientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&state=${organizationId}&access_type=offline&prompt=consent`;

  return NextResponse.redirect(authUrl);
}
