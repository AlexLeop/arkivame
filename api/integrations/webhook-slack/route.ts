import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { SlackIntegration } from '@/lib/integrations/slack';
import { decrypt } from '@/lib/encryption';
import { trackEvent } from '@/lib/analytics';
import { generateEmbedding, generateSummary, extractActionItems } from '@/lib/openai';
import { KnowledgeArchivalJobData } from '@/lib/queue';
import { checkAndNotifyLimits } from '@/lib/limit-notifications';
import { Prisma } from '@prisma/client';
import logger from '@/lib/logger';
import * as Sentry from '@sentry/nextjs';

// Define types for the message metadata and job data
interface MessageMetadata {
  channelId: string;
  threadTs: string;
  teamId: string;
  userId: string;
}

interface SlackMessage {
  channel: {
    name: string;
  };
  user: string;
  user_profile?: {
    real_name: string;
    image_72: string;
  };
  reactions?: Array<{ name: string; count: number }>;
  files?: Array<{ name: string; url_private: string }>;
  permalink?: string;
  ts: string;
  text: string;
}

// Define the job payload type for Slack webhook
interface SlackWebhookPayload {
  teamId: string;
  channelId: string;
  threadTs: string;
  reactingUserId: string;
  // Add other payload properties as needed
}

// Type guard to check if a job is a Slack job
function isSlackJob(job: KnowledgeArchivalJobData): job is Extract<KnowledgeArchivalJobData, { source: 'SLACK' }> {
  return job.source === 'SLACK';
}

// This is a worker for a serverless environment.
// It should be triggered by a service like Upstash QStash, which calls this endpoint for each job.

export async function POST(request: NextRequest) {
  // 1. Secure the endpoint
  const authorization = request.headers.get('Authorization');
  if (authorization !== `Bearer ${process.env.QUEUE_WORKER_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Initialize message metadata
  let messageMetadata: MessageMetadata | null = null;

  let job: KnowledgeArchivalJobData | null = null;

  try {
    const jobData = await request.json();
    job = jobData as KnowledgeArchivalJobData;

    // Type guard to ensure this is a Slack job
    if (!isSlackJob(job)) {
      throw new Error(`Invalid job source for Slack worker: ${job.source}`);
    }
    
    // Now TypeScript knows this is a Slack job
    const { teamId, channelId, threadTs, reactingUserId } = job.payload;

    // 2. Find the integration for this team using raw SQL for JSON filtering
    const integrations: any[] = await prisma.$queryRaw`
      SELECT i.*, 
             json_build_object(
               'id', o.id,
               'name', o.name,
               'slug', o.slug,
               'users', (
                 SELECT json_agg(
                   json_build_object(
                     'id', ou.id,
                     'role', ou.role,
                     'user', json_build_object(
                       'id', u.id,
                       'email', u.email,
                       'name', u.name,
                       'accounts', (
                         SELECT json_agg(
                           json_build_object(
                             'id', a.id,
                             'provider', a.provider,
                             'providerAccountId', a."providerAccountId",
                             'refresh_token', a."refresh_token",
                             'access_token', a."access_token",
                             'expires_at', a."expires_at",
                             'token_type', a."token_type",
                             'scope', a.scope,
                             'id_token', a."id_token",
                             'session_state', a."session_state"
                           )
                         )
                         FROM "Account" a
                         WHERE a."userId" = u.id AND a.provider = 'slack'
                       )
                     )
                   )
                 )
                 FROM "OrganizationUser" ou
                 JOIN "User" u ON ou."userId" = u.id
                 WHERE ou."organizationId" = o.id
               )
             ) as organization
      FROM "Integration" i
      JOIN "Organization" o ON i."organizationId" = o.id
      WHERE i.type = 'SLACK' AND i.config->>'team_id' = ${teamId}
      LIMIT 1
    `;

    const integration = integrations?.[0];

    if (!integration) {
      throw new Error(`No integration found for Slack team ID: ${teamId}`);
    }

    // 3. Set up Slack Integration
    const credentials = Object.entries(integration.credentials as any).reduce((acc, [key, value]) => {
      if (value) {
        acc[key] = decrypt(value as string);
      }
      return acc;
    }, {} as Record<string, string>);

    const slack = new SlackIntegration(credentials);

    // 4. Get the thread using the captureThread method
    const thread = await slack.captureThread(threadTs, channelId);
    
    if (!thread || !thread.messages || thread.messages.length === 0) {
      throw new Error(`Failed to capture thread: ${threadTs} in channel ${channelId}`);
    }
    
    const rootMessage = thread.messages[0];
    const replies = thread.messages.slice(1);
    
    // 5. Process the message and replies
    const content = [
      `*From:* <@${rootMessage.author}>\n*Channel:* ${thread.channelName || channelId}\n*Message:*\n${rootMessage.content}\n`,
      ...replies.map(r => `*Reply from <@${r.author}>:*\n${r.content}\n`)
    ].join('\n');
    
    // Store message metadata for error handling at the function level
    messageMetadata = {
      channelId,
      threadTs,
      teamId,
      userId: reactingUserId
    };

    // 6. Generate embeddings and summary
    const chatMessage = {
      author: rootMessage.author || 'unknown',
      content: content
    };
    
    const [embedding, summary, actionItems] = await Promise.all([
      generateEmbedding(chatMessage.content), // Some functions might expect just the content
      generateSummary([chatMessage]),
      extractActionItems([chatMessage])
    ]);

    // 8. Save to database using raw SQL to avoid type issues
    const knowledgeItem: any[] = await prisma.$queryRaw`
      WITH new_item AS (
        INSERT INTO "KnowledgeItem" (
          "id",
          "title",
          "content",
          "summary",
          "actionItems",
          "source",
          "sourceId",
          "sourceUrl",
          "embedding",
          "organizationId",
          "metadata",
          "createdAt",
          "updatedAt"
        ) VALUES (
          gen_random_uuid()::text,
          ${`Slack thread from ${new Date(parseFloat(threadTs) * 1000).toLocaleString()}`},
          ${content},
          ${summary},
          ${actionItems},
          'SLACK',
          ${threadTs},
          ${`https://${integration.organization.slug}.slack.com/archives/${channelId}/p${threadTs.replace('.', '')}`},
          ${embedding}::vector,
          ${integration.organization.id},
          ${JSON.stringify({
            channelId,
            channelName: thread.channelName || 'unknown',
            teamId,
            messageTs: threadTs,
            userId: rootMessage.author,
            userInfo: {
              id: rootMessage.author,
              name: rootMessage.author, // O nome real não está disponível na mensagem simplificada
              avatar: undefined, // O avatar não está disponível na mensagem simplificada
            },
            reactions: [], // As reações não estão disponíveis na mensagem simplificada
            files: [], // Os arquivos não estão disponíveis na mensagem simplificada
            permalink: `https://${integration.organization.slug}.slack.com/archives/${channelId}/p${threadTs.replace('.', '')}`
          })},
          NOW(),
          NOW()
        )
        RETURNING *
      )
      SELECT 
        ni.*,
        json_build_object(
          'id', o.id,
          'name', o.name,
          'slug', o.slug
        ) as "organization",
        (
          SELECT json_agg(t)
          FROM "Tag" t
          WHERE t.id IN (
            -- Get or create tags
            WITH tag_ids AS (
              SELECT id FROM "Tag" 
              WHERE (name = 'slack' AND "organizationId" = ${integration.organization.id})
              OR (name = ${`channel-${channelId}`} AND "organizationId" = ${integration.organization.id})
              
              UNION
              
              -- Insert new tags if they don't exist
              INSERT INTO "Tag" ("id", "name", "organizationId", "createdAt", "updatedAt")
              SELECT gen_random_uuid()::text, name, "organizationId", NOW(), NOW()
              FROM (VALUES 
                ('slack', ${integration.organization.id}),
                (${`channel-${channelId}`}, ${integration.organization.id})
              ) AS new_tags(name, "organizationId")
              WHERE NOT EXISTS (
                SELECT 1 FROM "Tag" t2 
                WHERE t2.name = new_tags.name 
                AND t2."organizationId" = new_tags."organizationId"
              )
              RETURNING id
            )
            SELECT id FROM tag_ids
          )
        ) as "tags"
      FROM new_item ni
      JOIN "Organization" o ON ni."organizationId" = o.id
    `;

    const result = knowledgeItem?.[0];

    if (!result) {
      throw new Error('Failed to create knowledge item');
    }

    // 9. Track event
    try {
      const eventName = `knowledge_item_created:${integration.organization.id}`;
      const eventProps = {
        source: 'slack',
        organizationId: integration.organization.id,
        knowledgeItemId: result.id,
        hasActionItems: actionItems && actionItems.length > 0,
        contentLength: content.length,
        replyCount: replies.length,
        userId: reactingUserId
      };
      await trackEvent(eventName, eventProps);
    } catch (trackError) {
      logger.error({ err: trackError }, 'Failed to track event');
    }

    // 9. Check and notify limits for storage
    try {
      await checkAndNotifyLimits(integration.organization.id, 'storage');
    } catch (limitError) {
      logger.error({ err: limitError }, 'Failed to check limits');
    }
    
    // Send success message to the thread
    try {
      if (isSlackJob(job)) {
        await slack.sendMessage(job.payload.channelId, `✅ Thread successfully archived in Arkivame!`, job.payload.threadTs);
      } else if (messageMetadata) {
        await slack.sendMessage(messageMetadata.channelId, `✅ Thread successfully archived in Arkivame!`, messageMetadata.threadTs);
      }
    } catch (messageError) {
      logger.error({ err: messageError }, 'Failed to send success message to Slack');
    }

    return NextResponse.json({ success: true, knowledgeItem: result });
  } catch (error: any) {
    logger.error({ err: error, job }, 'Error processing Slack thread job');
    
    // Safely get metadata from job or message context for error reporting
    const slackPayload = job && isSlackJob(job) ? job.payload : null;
    const errorChannelId = messageMetadata?.channelId || slackPayload?.channelId || 'unknown';
    const errorThreadTs = messageMetadata?.threadTs || slackPayload?.threadTs || 'unknown';
    const errorTeamId = messageMetadata?.teamId || slackPayload?.teamId || 'unknown';
    const errorUserId = messageMetadata?.userId || slackPayload?.reactingUserId || 'unknown';
    
    // Type assertion to ensure TypeScript knows these are strings
    const channelId = errorChannelId as string;
    const threadTs = errorThreadTs as string;
    
    // Try to send error message to Slack if we have the channel and thread
    if (channelId && threadTs) {
      try {
        const slack = new SlackIntegration({});
        await slack.sendMessage(
          channelId, 
          '❌ Erro ao arquivar thread. A equipe de suporte foi notificada.',
          threadTs
        );
      } catch (slackError) {
        logger.error({ err: slackError }, 'Failed to send error message to Slack');
      }
    }
    
    // Log to Sentry for better error tracking
    Sentry.captureException(error, {
      tags: {
        source: 'slack-webhook',
        teamId: errorTeamId as string,
        channelId: channelId,
        threadTs: threadTs,
        userId: errorUserId as string
      },
      extra: {
        job: job || {},
        error: error.message,
        stack: error.stack
      }
    });
    
    // Return 500 so the queue runner can retry the job
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: error.message 
      }, 
      { status: 500 }
    );
  }
}