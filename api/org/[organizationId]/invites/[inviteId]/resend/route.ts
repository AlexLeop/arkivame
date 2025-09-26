
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import crypto from 'crypto';

export async function POST(request: NextRequest, { params }: { params: { organizationId: string, inviteId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const invitation = await prisma.invitation.findUnique({
      where: {
        id: params.inviteId,
        organizationId: params.organizationId,
      },
    });

    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    // Generate a new token and expiry
    const newToken = crypto.randomBytes(32).toString('hex');
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 7); // Expires in 7 days

    await prisma.invitation.update({
      where: {
        id: params.inviteId,
      },
      data: {
        token: newToken,
        expiresAt: newExpiresAt,
      },
    });

    // TODO: Re-send invitation email with the new token
    console.log(`Resending invitation to ${invitation.email} with new token: ${newToken}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error resending invitation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
