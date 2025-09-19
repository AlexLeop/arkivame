import { Queue } from 'bullmq';
import { redisConnection } from './redis.connection';

export const stripeWebhookQueue = new Queue('stripe-webhooks', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3, // Retry failed jobs 3 times
    backoff: {
      type: 'exponential',
      delay: 5000, // 5s, 10s, 20s
    },
    removeOnComplete: true, // Clean up successful jobs
    removeOnFail: { count: 100 }, // Keep last 100 failed jobs
  },
});