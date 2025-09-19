
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createBillingPortalSession } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        organizations: {
          include: {
            organization: {
              include: { subscription: true }
            }
          },
          where: { role: 'OWNER' }
        }
      }
    });

    if (!user?.organizations?.[0]?.organization.subscription) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 404 });
    }

    const customerId = user.organizations[0].organization.subscription.stripeCustomerId;

    // Create billing portal session
    const portalSession = await createBillingPortalSession(
      customerId,
      `${request.headers.get('origin')}/billing`
    );

    return NextResponse.json({ 
      portalUrl: portalSession.url 
    });

  } catch (error) {
    console.error('Error creating portal session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
