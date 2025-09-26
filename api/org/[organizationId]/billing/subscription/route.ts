
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { stripe, PLANS } from '@/lib/stripe';

export async function GET(request: NextRequest, { params }: { params: { organizationId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organization = await prisma.organization.findUnique({
      where: { id: params.organizationId },
      include: { subscription: true },
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const subscription = organization.subscription;

    if (!subscription) {
      return NextResponse.json({
        planName: 'Free',
        status: 'inactive',
        currentPeriodEnd: null,
      });
    }

    return NextResponse.json({
      planName: subscription.plan,
      status: subscription.status,
      currentPeriodEnd: subscription.stripeCurrentPeriodEnd.toISOString(),
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { organizationId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { plan, interval } = await request.json();

    const organization = await prisma.organization.findUnique({
      where: { id: params.organizationId },
      include: { subscription: true },
    });

    if (!organization || !organization.subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    const planDetails = PLANS[plan as keyof typeof PLANS];
    if (!planDetails || !planDetails.stripePriceId) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    // Update subscription in Stripe
    await stripe.subscriptions.update(organization.subscription.stripeSubscriptionId, {
      cancel_at_period_end: false,
      items: [
        {
          id: organization.subscription.stripePriceId,
          price: planDetails.stripePriceId,
        },
      ],
    });

    // The webhook will update the database
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating subscription plan:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
