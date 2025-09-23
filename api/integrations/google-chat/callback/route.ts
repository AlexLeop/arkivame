
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import axios from 'axios';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const organizationId = request.nextUrl.searchParams.get('state');

  if (!code || !organizationId) {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/${organizationId}/integrations?error=google_auth_failed`);
  }

  try {
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: `${process.env.NEXTAUTH_URL}/api/integrations/google-chat/callback`,
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const { access_token, refresh_token, expires_in } = tokenResponse.data;

    await prisma.integration.upsert({
      where: {
        organizationId_name: { organizationId, name: 'Google Chat' },
      },
      update: {
        credentials: { accessToken: access_token, refreshToken: refresh_token, expiresIn: expires_in },
        isActive: true,
      },
      create: {
        organizationId: organizationId,
        name: 'Google Chat',
        type: 'GOOGLE_CHAT',
        credentials: { accessToken: access_token, refreshToken: refresh_token, expiresIn: expires_in },
        isActive: true,
      },
    });

    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/${organizationId}/integrations?success=google_connected`);
  } catch (error) {
    console.error('Google Chat OAuth error:', error);
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/${organizationId}/integrations?error=google_auth_failed`);
  }
}
