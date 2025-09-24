import { Worker, Job } from 'bullmq';
import Stripe from 'stripe';
import { redisConnection } from '../redis/redis.connection';
import logger from '@/lib/logger';
import {
  handleCheckoutSessionCompleted,
  handleInvoicePaymentSucceeded,
  handleSubscriptionChange,
} from '@/lib/stripe-handlers';

const processor = async (job: Job) => {
  const { event } = job.data;
  logger.info({ eventType: event.type, jobId: job.id }, 'Processing Stripe webhook job');

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await handleSubscriptionChange(
          event.data.object as Stripe.Subscription & { current_period_end: number },
          event.type === 'customer.subscription.deleted',
        );
        break;
      default:
        logger.warn({ eventType: event.type }, 'Unhandled event type in worker');
    }
  } catch (error: any) {
    logger.error({ err: error, eventType: event.type, jobId: job.id }, 'Stripe webhook job failed');
    // Re-throw to let BullMQ handle the retry
    throw error;
  }
};

export const stripeWebhookWorker = new Worker('stripe-webhooks', processor, {
  connection: redisConnection,
  concurrency: 5, // Process up to 5 jobs concurrently
});

stripeWebhookWorker.on('completed', (job: Job) => {
  logger.info({ eventType: job.data.event.type, jobId: job.id }, 'Stripe webhook job completed');
});

logger.info('Stripe webhook worker started and listening for jobs...');
