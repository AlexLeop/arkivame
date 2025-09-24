import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { validateUserOrgAccess } from '@/lib/permissions';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const orgId = searchParams.get('orgId');

    if (!userId || !orgId) {
      return NextResponse.json({ error: 'Missing userId or orgId' }, { status: 400 });
    }

    await validateUserOrgAccess(prisma, userId, orgId);
    return NextResponse.json({ authorized: true });
  } catch (error) {
    if (error instanceof Error && error.name === 'NotAuthorizedError') {
      return NextResponse.json({ authorized: false, error: error.message }, { status: 403 });
    }
    console.error('Error in check-org-access API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
