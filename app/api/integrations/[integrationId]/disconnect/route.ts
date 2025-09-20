import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: { integrationId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { integrationId } = params;
    const { organizationId } = await request.json();

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    // In a real application, you would update the database to reflect
    // the disconnected status and potentially revoke tokens.
    await prisma.integration.updateMany({
      where: {
        organizationId,
        type: integrationId.toUpperCase(), // Assuming integrationId matches the enum in Prisma
      },
      data: {
        status: 'DISCONNECTED',
        accessToken: null, // Clear sensitive data
        refreshToken: null,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Error disconnecting integration ${params.integrationId}:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


