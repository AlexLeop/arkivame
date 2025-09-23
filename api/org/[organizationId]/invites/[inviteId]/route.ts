
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

export async function DELETE(request: NextRequest, { params }: { params: { organizationId: string, inviteId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.invitation.delete({
      where: {
        id: params.inviteId,
        organizationId: params.organizationId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error revoking invitation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
