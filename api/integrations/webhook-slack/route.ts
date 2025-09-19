import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SlackIntegration } from '@/lib/integrations/slack';
import { decrypt } from '@/lib/encryption';
import { trackEvent } from '@/lib/analytics';
import { generateEmbedding, generateSummary, extractActionItems } from '@/lib/openai';
import { KnowledgeArchivalJobData } from '@/lib/queue';
import { checkAndNotifyLimits } from '@/lib/limit-notifications';
import { Prisma } from '@prisma/client';
import logger from '@/lib/logger';
import * as Sentry from '@sentry/nextjs';

// This is a worker for a serverless environment.
// It should be triggered by a service like Upstash QStash, which calls this endpoint for each job.

export async function POST(request: NextRequest) {
  // 1. Secure the endpoint
  const authorization = request.headers.get('Authorization');
  if (authorization !== `Bearer ${process.env.QUEUE_WORKER_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let job: KnowledgeArchivalJobData | null = null;

  try {
    job = (await request.json()) as KnowledgeArchivalJobData;
    const { teamId, channelId, threadTs, reactingUserId } = job;

    // 2. Find the integration for this team
    const integration = await prisma.integration.findFirst({
      where: {
        type: 'SLACK',
        teamId: teamId,
      },
      include: {
        organization: {
          include: { users: { include: { user: true } } },
        },
      },
    });

    if (!integration) {
      throw new Error(`No integration found for Slack team ID: ${teamId}`);
    }

    // 3. Set up Slack Integration
    const credentials = Object.entries(integration.credentials as Prisma.JsonObject).reduce((acc, [key, value]) => {
      acc[key] = decrypt(value as string);
      return acc;
    }, {} as Record<string, string>);

    const slackIntegration = new SlackIntegration({
      type: 'SLACK',
      credentials,
      settings: integration.config,
    });

    try {
      // 4. Process the job
      const capturedThread = await slackIntegration.captureThread(threadTs, channelId);
      const authorInfo = await slackIntegration.getUserInfo(capturedThread.rootAuthor);

      const title = capturedThread.messages[0]?.content?.substring(0, 100) || 'Untitled Thread';
      const textToProcess = `Title: ${title}\n\nContent:\n${capturedThread.messages.map((m: any) => `${m.author}: ${m.content}`).join('\n')}`;

      // Critical operation: if this fails, the job should fail and be retried.
      const embedding = await generateEmbedding(textToProcess);

      // Non-critical operations with fallbacks.
      // If these fail, the job can still succeed with default values.
      const summary = await generateSummary(capturedThread.messages).catch(err => {
        logger.warn({ err, job }, 'Failed to generate summary, using fallback.');
        Sentry.captureException(err);
        return 'Não foi possível gerar o resumo.';
      });

      const actionItems = await extractActionItems(capturedThread.messages).catch(err => {
        logger.warn({ err, job }, 'Failed to extract action items, using fallback.');
        Sentry.captureException(err);
        return [];
      });

      const reactingUser = integration.organization.users.find(u => u.user.slackId === reactingUserId);

      // 5. Save to knowledge base
      await prisma.knowledgeItem.create({
        data: {
          organizationId: integration.organizationId,
          title,
          summary,
          actionItems,
          content: capturedThread.messages,
          threadId: capturedThread.id,
          channelId: capturedThread.channelId,
          channelName: capturedThread.channelName,
          sourceType: 'SLACK',
          sourceMetadata: capturedThread.metadata,
          createdById: reactingUser?.userId || integration.organization.users[0]?.userId || '', // Fallback
          rootMessageAuthor: authorInfo?.real_name || authorInfo?.name || 'Unknown',
          originalTimestamp: capturedThread.timestamp,
          status: 'PUBLISHED',
          embedding,
        },
      });

      // 6. Send confirmation and track event
      await slackIntegration.sendMessage(channelId, `📚 Thread arquivada com sucesso no Arkivame!`, threadTs);
      await trackEvent('knowledge_archived', { source: 'slack', channelId, userId: reactingUserId }, integration.organizationId);

      // 7. Check usage limits
      await checkAndNotifyLimits(integration.organizationId, 'archivements');

      return NextResponse.json({ success: true, message: `Job for thread ${threadTs} processed.` });

    } catch (error) {
      logger.error({ err: error, job }, `Error processing Slack thread job ${threadTs}`);
      await slackIntegration.sendMessage(channelId, `❌ Erro ao arquivar thread. A equipe de suporte foi notificada.`, threadTs);
      throw error; // Throw error so the queue runner knows the job failed
    }
  } catch (error: any) {
    logger.error({ err: error, job }, 'Error in knowledge worker');
    // Return 500 so the queue runner can retry the job
    return NextResponse.json({ error: 'Internal server error', message: error.message }, { status: 500 });
  }
}