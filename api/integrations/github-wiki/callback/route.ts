
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import axios from 'axios';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const organizationId = request.nextUrl.searchParams.get('state');

  if (!code || !organizationId) {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/${organizationId}/integrations?error=github_auth_failed`);
  }

  try {
    const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
      client_id: process.env.GITHUB_CLIENT_ID!,
      client_secret: process.env.GITHUB_CLIENT_SECRET!,
      code: code,
      redirect_uri: `${process.env.NEXTAUTH_URL}/api/integrations/github-wiki/callback`,
    }, {
      headers: {
        'Accept': 'application/json',
      },
    });

    const { access_token } = tokenResponse.data;

    await prisma.integration.upsert({
      where: {
        organizationId_name: { organizationId, name: 'GitHub Wiki' },
      },
      update: {
        credentials: { accessToken: access_token },
        isActive: true,
      },
      create: {
        organizationId: organizationId,
        name: 'GitHub Wiki',
        type: 'GITHUB_WIKI',
        credentials: { accessToken: access_token },
        isActive: true,
      },
    });

    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/${organizationId}/integrations?success=github_connected`);
  } catch (error) {
    console.error('GitHub OAuth error:', error);
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/${organizationId}/integrations?error=github_auth_failed`);
  }
}
