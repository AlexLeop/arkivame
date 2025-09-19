import Stripe from 'stripe';
import { prisma } from '@/lib/db';
import { Plan, SubscriptionStatus } from '@prisma/client';
import logger from '@/lib/logger';
import { getPlanByPriceId, stripe } from '@/lib/stripe';
import { redisConnection } from '@/lib/queues/redis/redis.connection';

function isPlan(plan: string): plan is Plan {
  return Object.values(Plan).includes(plan as Plan);
}

function isSubscriptionStatus(status: string): status is SubscriptionStatus {
  return Object.values(SubscriptionStatus).includes(status as SubscriptionStatus);
}

/**
 * Handles the 'checkout.session.completed' event.
 * Creates or updates the organization's subscription details.
 * @param session The Stripe Checkout Session object.
 */
export async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const subscriptionId = session.subscription as string;

  if (!session?.metadata?.organizationId) {
    throw new Error('Missing organizationId in checkout session metadata');
  }

  const cacheKey = `subscription:cache:${subscriptionId}`;
  let subscription: Stripe.Subscription & { current_period_end: number };

  const cachedSubscription = await redisConnection.get(cacheKey);

  if (cachedSubscription) {
    subscription = JSON.parse(cachedSubscription);
    logger.info({ subscriptionId }, 'Subscription retrieved from cache.');
  } else {
    const freshSubscription = (await stripe.subscriptions.retrieve(
      subscriptionId,
    )) as unknown as Stripe.Subscription & { current_period_end: number };

    await redisConnection.set(
      cacheKey,
      JSON.stringify(freshSubscription),
      'EX',
      60 * 5, // Cache for 5 minutes
    );
    subscription = freshSubscription;
    logger.info({ subscriptionId }, 'Subscription fetched from Stripe and cached.');
  }

  const priceId = subscription.items.data[0]?.price.id;
  const planName = getPlanByPriceId(priceId);

  if (!planName || !isPlan(planName)) {
    throw new Error(`Plan not found or invalid for price ID: ${priceId}`);
  }

  const stripeStatus = subscription.status.toUpperCase();
  if (!isSubscriptionStatus(stripeStatus)) {
    throw new Error(
      `Unknown subscription status from Stripe: ${subscription.status}`,
    );
  }

  // Atualiza o plano na organização e cria/atualiza a assinatura
  await prisma.organization.update({
    where: {
      id: session.metadata.organizationId,
    },
    data: {
      plan: planName,
      subscription: {
        upsert: {
          create: {
            stripeSubscriptionId: subscription.id,
            stripeCustomerId: subscription.customer as string,
            stripePriceId: priceId,
            stripeCurrentPeriodEnd: new Date(
              subscription.current_period_end * 1000,
            ),
            plan: planName,
            status: stripeStatus,
          },
          update: {
            stripePriceId: priceId,
            stripeCurrentPeriodEnd: new Date(
              subscription.current_period_end * 1000,
            ),
            plan: planName,
            status: stripeStatus,
          },
        },
      },
    },
  });

  logger.info(
    { organizationId: session.metadata.organizationId, plan: planName },
    'Organization subscribed to new plan',
  );
}

/**
 * Handles the 'invoice.payment_succeeded' event.
 * Renews the subscription period for an organization.
 * @param invoice The Stripe Invoice object.
 */
export async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscriptionId = (invoice as Stripe.Invoice & { subscription: string })
    .subscription;

  // Atualiza a data de expiração do plano no modelo Subscription
  await prisma.subscription.update({
    where: {
      stripeSubscriptionId: subscriptionId,
    },
    data: {
      stripeCurrentPeriodEnd: new Date(invoice.period_end * 1000),
    },
  });

  logger.info(
    { stripeSubscriptionId: subscriptionId },
    'Organization subscription renewed',
  );
}

/**
 * Handles 'customer.subscription.updated' and 'customer.subscription.deleted' events.
 * @param subscription The Stripe Subscription object.
 * @param isDeleted A flag indicating if the event is a deletion.
 */
export async function handleSubscriptionChange(
  subscription: Stripe.Subscription & { current_period_end: number },
  isDeleted: boolean,
) {
  await prisma.$transaction(async (tx) => {
    if (isDeleted) {
      // Handle cancellation
      const dbSubscription = await tx.subscription.update({
        where: { stripeSubscriptionId: subscription.id },
        data: {
          status: 'CANCELED',
          canceledAt: subscription.canceled_at
            ? new Date(subscription.canceled_at * 1000)
            : new Date(),
        },
      });
      // Downgrade organization to FREE plan
      await tx.organization.update({
        where: { id: dbSubscription.organizationId },
        data: { plan: 'FREE' },
      });
    } else {
      // Handle update (upgrade/downgrade)
      const priceId = subscription.items.data[0]?.price.id;
      const planName = getPlanByPriceId(priceId);

      if (!planName || !isPlan(planName)) {
        throw new Error(`Plan not found or invalid for price ID: ${priceId}`);
      }
  
      const stripeStatus = subscription.status.toUpperCase();
      if (!isSubscriptionStatus(stripeStatus)) {
        throw new Error(
          `Unknown subscription status from Stripe: ${subscription.status}`,
        );
      }

      const dbSubscription = await tx.subscription.update({
        where: { stripeSubscriptionId: subscription.id },
        data: {
          plan: planName,
          stripePriceId: priceId,
          stripeCurrentPeriodEnd: new Date(
            subscription.current_period_end * 1000,
          ),
          status: stripeStatus,
        },
      });
      // Update organization's plan
      await tx.organization.update({
        where: { id: dbSubscription.organizationId },
        data: { plan: planName },
      });
    }
  });
}