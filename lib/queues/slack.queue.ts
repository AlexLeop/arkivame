import { Queue } from 'bullmq';

export const slackQueue = new Queue('slackMessageProcessing', {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
  },
});

export interface SlackMessageJobData {
  organizationId: string;
  threadId: string;
  channelId: string;
  channelName: string;
  reactorUserId: string;
  rootMessageAuthor: string;
  messages: { author: string; text: string; timestamp: string }[];
  rootMessageText: string;
}
