import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth-config';
import { prisma } from '@/lib/db';
import { stripe, createBillingPortalSession, createCheckoutSession, PLANS } from '@/lib/stripe';

// GET handler remains the same...

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, plan } = await request.json();

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        organizations: {
          include: {
            organization: {
              include: { subscription: true },
            },
          },
        },
      },
    });

    if (!user?.organizations?.[0]) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const organization = user.organizations[0].organization;
    const subscription = organization.subscription;

    switch (action) {
      case 'change_plan':
        if (subscription?.stripeSubscriptionId) {
          // User has a subscription, create a billing portal session
          const portalSession = await createBillingPortalSession(
            subscription.stripeCustomerId,
            `${request.headers.get('origin')}/subscription`
          );
          return NextResponse.json({ portalUrl: portalSession.url });
        } else {
          // User has no subscription, create a new checkout session
          const planDetails = PLANS[plan as keyof typeof PLANS];
          if (!planDetails || !planDetails.stripePriceId) {
            return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
          }

          const customerId = await getOrCreateStripeCustomerId(user, organization);
          const checkoutSession = await createCheckoutSession(
            customerId,
            planDetails.stripePriceId,
            `${request.headers.get('origin')}/subscription?success=true`,
            `${request.headers.get('origin')}/subscription?canceled=true`
          );
          return NextResponse.json({ checkoutUrl: checkoutSession.url });
        }

      case 'cancel':
        if (!subscription?.stripeSubscriptionId) {
          return NextResponse.json({ error: 'No active subscription to cancel' }, { status: 400 });
        }
        await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
          cancel_at_period_end: true,
        });
        // The webhook will update the database
        break;

      case 'reactivate':
        if (!subscription?.stripeSubscriptionId) {
          return NextResponse.json({ error: 'No subscription to reactivate' }, { status: 400 });
        }
        await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
          cancel_at_period_end: false,
        });
        // The webhook will update the database
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating subscription:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function getOrCreateStripeCustomerId(user: any, organization: any) {
  if (organization.subscription?.stripeCustomerId) {
    return organization.subscription.stripeCustomerId;
  }

  const customer = await stripe.customers.create({
    email: user.email!,
    name: organization.name,
    metadata: {
      organizationId: organization.id,
    },
  });

  // Update the subscription record with the new customer ID
  await prisma.subscription.upsert({
    where: { organizationId: organization.id },
    update: { stripeCustomerId: customer.id },
    create: {
      organizationId: organization.id,
      stripeCustomerId: customer.id,
      plan: 'FREE', // Default plan
      status: 'INCOMPLETE',
      stripeSubscriptionId: 'dummy_sub_id_for_upsert',
      stripePriceId: PLANS.FREE.stripePriceId || '', // Assuming FREE plan has a stripePriceId
      stripeCurrentPeriodEnd: new Date(), // Placeholder
      organization: { connect: { id: organization.id } },
    },
  });

  return customer.id;
}