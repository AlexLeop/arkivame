import { Queue, Worker } from 'bullmq';
import { Redis } from 'ioredis';
import logger from '@/lib/logger';

let redisConnection: Redis | null = null;
let stripeQueueInstance: Queue | null = null;
let stripeWorkerInstance: Worker | null = null;

function getRedisConnection() {
  if (redisConnection) {
    return redisConnection;
  }

  if (process.env.REDIS_URL) {
    redisConnection = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
    });
    return redisConnection;
  }

  logger.warn('Stripe queue system is disabled. REDIS_URL is not configured.');
  return null;
}

export function getStripeQueue() {
  if (stripeQueueInstance) {
    return stripeQueueInstance;
  }

  const connection = getRedisConnection();
  if (connection) {
    stripeQueueInstance = new Queue('stripe-webhooks', {
      connection,
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    });
    return stripeQueueInstance;
  }

  return null;
}

// Job types
export interface StripeWebhookJob {
  eventId: string;
  eventType: string;
  data: any;
  timestamp: number;
}

// Add job to queue
export async function addStripeWebhookJob(job: StripeWebhookJob) {
  const stripeQueue = getStripeQueue();
  if (!stripeQueue) {
    throw new Error('Stripe queue not initialized');
  }

  try {
    await stripeQueue.add('process-webhook', job, {
      jobId: job.eventId, // Prevent duplicate processing
    });
    
    logger.info({
      eventId: job.eventId,
      eventType: job.eventType
    }, 'Stripe webhook job added to queue');
  } catch (error) {
    logger.error({
      error,
      eventId: job.eventId,
      eventType: job.eventType
    }, 'Failed to add Stripe webhook job to queue');
    throw error;
  }
}

export function getStripeWorker() {
    if (stripeWorkerInstance) {
        return stripeWorkerInstance;
    }

    const connection = getRedisConnection();
    if (connection) {
        stripeWorkerInstance = new Worker(
            'stripe-webhooks',
            async (job) => {
              const { eventId, eventType, data } = job.data as StripeWebhookJob;
              
              logger.info({
                eventId,
                eventType,
                jobId: job.id
              }, 'Processing Stripe webhook job');
          
              try {
                switch (eventType) {
                  case 'customer.subscription.created':
                    await handleSubscriptionCreated(data);
                    break;
                  case 'customer.subscription.updated':
                    await handleSubscriptionUpdated(data);
                    break;
                  case 'customer.subscription.deleted':
                    await handleSubscriptionDeleted(data);
                    break;
                  case 'invoice.payment_succeeded':
                    await handlePaymentSucceeded(data);
                    break;
                  case 'invoice.payment_failed':
                    await handlePaymentFailed(data);
                    break;
                  default:
                    logger.info({ eventType }, 'Unhandled Stripe event type');
                }
          
                logger.info({
                  eventId,
                  eventType,
                  jobId: job.id
                }, 'Stripe webhook job processed successfully');
          
              } catch (error) {
                logger.error({
                  error,
                  eventId,
                  eventType,
                  jobId: job.id
                }, 'Failed to process Stripe webhook job');
                throw error;
              }
            },
            {
              connection,
              concurrency: 5,
            }
          );
        return stripeWorkerInstance;
    }

    return null;
}


// Event handlers
async function handleSubscriptionCreated(subscription: any) {
  // Handle new subscription creation
  logger.info({
    subscriptionId: subscription.id,
    customerId: subscription.customer
  }, 'Processing subscription created');
  
  // In a real implementation, you would:
  // 1. Update user's subscription status in database
  // 2. Send welcome email
  // 3. Set up usage tracking
}

async function handleSubscriptionUpdated(subscription: any) {
  // Handle subscription updates (plan changes, etc.)
  logger.info({
    subscriptionId: subscription.id,
    customerId: subscription.customer,
    status: subscription.status
  }, 'Processing subscription updated');
  
  // In a real implementation, you would:
  // 1. Update subscription details in database
  // 2. Adjust user limits based on new plan
  // 3. Send notification if needed
}

async function handleSubscriptionDeleted(subscription: any) {
  // Handle subscription cancellation
  logger.info({
    subscriptionId: subscription.id,
    customerId: subscription.customer
  }, 'Processing subscription deleted');
  
  // In a real implementation, you would:
  // 1. Update user's subscription status
  // 2. Downgrade to free plan
  // 3. Send cancellation confirmation
}

async function handlePaymentSucceeded(invoice: any) {
  // Handle successful payment
  logger.info({
    invoiceId: invoice.id,
    customerId: invoice.customer,
    amount: invoice.amount_paid
  }, 'Processing payment succeeded');
  
  // In a real implementation, you would:
  // 1. Update payment history
  // 2. Send receipt
  // 3. Extend subscription period
}

async function handlePaymentFailed(invoice: any) {
  // Handle failed payment
  logger.info({
    invoiceId: invoice.id,
    customerId: invoice.customer,
    amount: invoice.amount_due
  }, 'Processing payment failed');
  
  // In a real implementation, you would:
  // 1. Update payment status
  // 2. Send payment failure notification
  // 3. Implement retry logic or grace period
}

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down Stripe worker...');
  const worker = getStripeWorker();
  if (worker) {
    await worker.close();
  }
  const connection = getRedisConnection();
  if (connection) {
    await connection.quit();
  }
  process.exit(0);
});