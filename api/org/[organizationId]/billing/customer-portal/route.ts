
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../lib/auth-config';
import { createBillingPortalSession } from '@/lib/stripe';

export async function POST(request: NextRequest, { params }: { params: { organizationId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organization = await prisma.organization.findUnique({
      where: { id: params.organizationId },
      include: { subscription: true },
    });

    if (!organization || !organization.subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    const portalSession = await createBillingPortalSession(
      organization.subscription.stripeCustomerId,
      `${request.headers.get('origin')}/dashboard/${params.organizationId}/settings`
    );

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error('Error creating billing portal session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
