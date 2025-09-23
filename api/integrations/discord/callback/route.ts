
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import axios from 'axios';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const organizationId = request.nextUrl.searchParams.get('state');

  if (!code || !organizationId) {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/${organizationId}/integrations?error=discord_auth_failed`);
  }

  try {
    const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', new URLSearchParams({
      client_id: process.env.DISCORD_CLIENT_ID!,
      client_secret: process.env.DISCORD_CLIENT_SECRET!,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: `${process.env.NEXTAUTH_URL}/api/integrations/discord/callback`,
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const { access_token, refresh_token, expires_in } = tokenResponse.data;

    await prisma.integration.upsert({
      where: {
        organizationId_name: { organizationId, name: 'Discord' },
      },
      update: {
        credentials: { accessToken: access_token, refreshToken: refresh_token, expiresIn: expires_in },
        isActive: true,
      },
      create: {
        organizationId: organizationId,
        name: 'Discord',
        type: 'DISCORD',
        credentials: { accessToken: access_token, refreshToken: refresh_token, expiresIn: expires_in },
        isActive: true,
      },
    });

    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/${organizationId}/integrations?success=discord_connected`);
  } catch (error) {
    console.error('Discord OAuth error:', error);
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/${organizationId}/integrations?error=discord_auth_failed`);
  }
}
