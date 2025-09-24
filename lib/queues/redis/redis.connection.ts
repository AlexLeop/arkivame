import IORedis from 'ioredis';

if (!process.env.REDIS_URL) {
  throw new Error('REDIS_URL is not set in environment variables');
}

// The maxRetriesPerRequest option must be null for BullMQ
export const redisConnection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
});
