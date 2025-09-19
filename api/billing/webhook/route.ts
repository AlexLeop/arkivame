
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

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
        
        // Find organization by customer ID
        const subscription = await prisma.subscription.findUnique({
          where: { stripeCustomerId: session.customer },
          include: { organization: true }
        });

        if (subscription) {
          // Update subscription status
          await prisma.subscription.update({
            where: { id: subscription.id },
            data: {
              stripeSubscriptionId: session.subscription,
              status: 'ACTIVE',
            }
          });
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as any;
        
        await prisma.subscription.upsert({
          where: { stripeSubscriptionId: subscription.id },
          update: {
            status: subscription.status.toUpperCase(),
            stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
          },
          create: {
            stripeCustomerId: subscription.customer,
            stripeSubscriptionId: subscription.id,
            stripePriceId: subscription.items.data[0].price.id,
            stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
            plan: 'STARTER', // Default plan, should be determined from price ID
            status: subscription.status.toUpperCase(),
            organizationId: '', // This would need to be set based on customer lookup
          }
        });
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;
        
        await prisma.subscription.update({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            status: 'CANCELED',
            canceledAt: new Date(),
          }
        });
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as any;
        
        // Record payment history
        await prisma.paymentHistory.create({
          data: {
            stripePaymentIntentId: paymentIntent.id,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            status: 'SUCCEEDED',
            description: paymentIntent.description,
            receiptUrl: paymentIntent.charges?.data?.[0]?.receipt_url,
            organizationId: '', // This would need customer lookup
          }
        });
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
