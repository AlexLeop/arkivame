
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const organizationId = request.nextUrl.searchParams.get('organizationId');
  if (!organizationId) {
    return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
  }

  const discordClientId = process.env.DISCORD_CLIENT_ID;
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/integrations/discord/callback`;
  const scope = 'bot applications.commands'; // Adjust scope as needed

  const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${discordClientId}&scope=${scope}&response_type=code&redirect_uri=${redirectUri}&state=${organizationId}`;

  return NextResponse.redirect(authUrl);
}
