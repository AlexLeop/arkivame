import { Worker } from 'bullmq';
import { prisma } from '@/lib/db';
import { generateSummary, extractActionItems, detectTopics, generateEmbedding } from '@/lib/openai';
import logger from '@/lib/logger';
import { SlackMessageJobData } from '@/lib/queues/slack.queue';

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
};

export const slackWorker = new Worker<SlackMessageJobData>(
  'slackMessageProcessing',
  async (job) => {
    const { organizationId, threadId, channelId, channelName, reactorUserId, rootMessageAuthor, messages, rootMessageText } = job.data;
    logger.info(`Processing Slack message job for thread ${threadId} in organization ${organizationId}`);

    try {
      // Check if this knowledge item already exists to prevent duplicates
      const existingKnowledgeItem = await prisma.knowledgeItem.findFirst({
        where: {
          organizationId: organizationId,
          threadId: threadId,
          channelId: channelId,
        },
      });

      if (existingKnowledgeItem) {
        logger.info({ threadId, channelId }, 'Knowledge item already exists, skipping processing.');
        return;
      }

      const chatMessages = messages.map(msg => ({ author: msg.author, content: msg.text }));
      const fullTextContent = chatMessages.map(msg => msg.content).join('\n');

      // Generate AI insights
      const summary = await generateSummary(chatMessages);
      const actionItems = await extractActionItems(chatMessages);
      const topics = await detectTopics(chatMessages);
      const embedding = await generateEmbedding(fullTextContent); // Generate embedding here

      // Store in DB
      await prisma.knowledgeItem.create({
        data: {
          organizationId: organizationId,
          title: rootMessageText ? rootMessageText.substring(0, 250) : 'Slack Thread',
          content: messages as any, // Prisma Json type
          summary: summary,
          actionItems: actionItems as any, // Prisma Json type
          topics: topics as any, // Prisma Json type
          embedding: embedding, // Store the generated embedding
          threadId: threadId,
          channelId: channelId,
          channelName: channelName,
          sourceType: 'SLACK',
          createdById: reactorUserId, // TODO: Map to actual User ID in our DB
          rootMessageAuthor: rootMessageAuthor,
          archivedById: reactorUserId, // TODO: Map to actual User ID in our DB
        },
      });

      logger.info(`Successfully processed Slack message job for thread ${threadId}`);
    } catch (error) {
      logger.error({ error, threadId, organizationId }, 'Failed to process Slack message job');
      throw error; // Re-throw to allow BullMQ to handle retries
    }
  },
  { connection }
);

// Start the worker
slackWorker.run();

logger.info('Slack message processing worker started.');
