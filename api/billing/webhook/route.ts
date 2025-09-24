import { NextRequest, NextResponse } from 'next/server';
import { stripe, getPlanByPriceId } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { Plan } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'No signature provided' }, { status: 400 });
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        const subscription = await prisma.subscription.findUnique({
          where: { stripeCustomerId: session.customer },
        });

        if (subscription) {
          await prisma.subscription.update({
            where: { id: subscription.id },
            data: {
              stripeSubscriptionId: session.subscription,
              status: 'ACTIVE',
            },
          });
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as any;
        const plan = getPlanByPriceId(subscription.items.data[0].price.id) || 'STARTER';
        
        const org = await prisma.organization.findFirst({
            where: { subscription: { stripeCustomerId: subscription.customer } },
        });

        if(org) {
            await prisma.subscription.upsert({
              where: { stripeSubscriptionId: subscription.id },
              update: {
                status: subscription.status.toUpperCase(),
                stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
                cancelAtPeriodEnd: subscription.cancel_at_period_end,
                plan: plan as Plan,
              },
              create: {
                stripeCustomerId: subscription.customer,
                stripeSubscriptionId: subscription.id,
                stripePriceId: subscription.items.data[0].price.id,
                stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
                plan: plan as Plan,
                status: subscription.status.toUpperCase(),
                organizationId: org.id,
              },
            });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;
        await prisma.subscription.update({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            status: 'CANCELED',
            canceledAt: new Date(),
          },
        });
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as any;
        const org = await prisma.organization.findFirst({
            where: { subscription: { stripeCustomerId: paymentIntent.customer } },
        });

        if(org) {
            await prisma.paymentHistory.create({
              data: {
                stripePaymentIntentId: paymentIntent.id,
                amount: paymentIntent.amount,
                currency: paymentIntent.currency,
                status: 'SUCCEEDED',
                description: paymentIntent.description,
                receiptUrl: paymentIntent.charges?.data?.[0]?.receipt_url,
                organizationId: org.id,
              },
            });
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 400 }
    );
  }
}