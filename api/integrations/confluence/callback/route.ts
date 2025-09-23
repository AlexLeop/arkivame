
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import axios from 'axios';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const organizationId = request.nextUrl.searchParams.get('state');

  if (!code || !organizationId) {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/${organizationId}/integrations?error=confluence_auth_failed`);
  }

  try {
    const tokenResponse = await axios.post('https://auth.atlassian.com/oauth/token', {
      grant_type: 'authorization_code',
      client_id: process.env.CONFLUENCE_CLIENT_ID!,
      client_secret: process.env.CONFLUENCE_CLIENT_SECRET!,
      code: code,
      redirect_uri: `${process.env.NEXTAUTH_URL}/api/integrations/confluence/callback`,
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const { access_token, refresh_token, expires_in } = tokenResponse.data;

    await prisma.integration.upsert({
      where: {
        organizationId_name: { organizationId, name: 'Confluence' },
      },
      update: {
        credentials: { accessToken: access_token, refreshToken: refresh_token, expiresIn: expires_in },
        isActive: true,
      },
      create: {
        organizationId: organizationId,
        name: 'Confluence',
        type: 'CONFLUENCE',
        credentials: { accessToken: access_token, refreshToken: refresh_token, expiresIn: expires_in },
        isActive: true,
      },
    });

    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/${organizationId}/integrations?success=confluence_connected`);
  } catch (error) {
    console.error('Confluence OAuth error:', error);
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/${organizationId}/integrations?error=confluence_auth_failed`);
  }
}
