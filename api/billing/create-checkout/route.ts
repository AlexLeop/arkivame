
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createCheckoutSession, PLANS } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { plan } = await request.json();

    if (!plan || !PLANS[plan as keyof typeof PLANS]) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const planDetails = PLANS[plan as keyof typeof PLANS];

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

    if (!user?.organizations?.[0]) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const organization = user.organizations[0].organization;

    // Check if organization already has active subscription
    if (organization.subscription?.status === 'ACTIVE') {
      return NextResponse.json({ error: 'Organization already has active subscription' }, { status: 400 });
    }

    let customerId = organization.subscription?.stripeCustomerId;

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const { createStripeCustomer } = await import('@/lib/stripe');
      const customer = await createStripeCustomer(
        user.email,
        organization.name
      );
      customerId = customer.id;
    }

    // Create checkout session
    const checkoutSession = await createCheckoutSession(
      customerId,
      planDetails.stripePriceId!,
      `${request.headers.get('origin')}/dashboard?success=true`,
      `${request.headers.get('origin')}/billing?canceled=true`
    );

    return NextResponse.json({ 
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id 
    });

  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
