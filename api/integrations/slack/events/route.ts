import { NextRequest, NextResponse } from 'next/server';
import { WebClient } from '@slack/web-api';
import crypto from 'crypto';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';
import { slackQueue } from '@/lib/queues/slack.queue';

const slackSigningSecret = process.env.SLACK_SIGNING_SECRET;
const slackBotToken = process.env.SLACK_BOT_TOKEN;

const slackClient = new WebClient(slackBotToken);

async function verifySlackRequest(req: NextRequest, body: string) {
  const signature = req.headers.get('x-slack-signature');
  const timestamp = req.headers.get('x-slack-request-timestamp');

  if (!signature || !timestamp || !slackSigningSecret) {
    logger.error('Missing Slack headers or signing secret');
    return false;
  }

  const time = ~~(Date.now() / 1000);
  if (Math.abs(time - parseInt(timestamp)) > 300) { // Request is older than 5 minutes
    logger.warn('Slack request timestamp too old');
    return false;
  }

  const sigBasestring = 'v0:' + timestamp + ':' + body;
  const mySignature = 'v0=' + crypto.createHmac('sha256', slackSigningSecret)
    .update(sigBasestring)
    .digest('hex');

  if (crypto.timingSafeEqual(Buffer.from(mySignature), Buffer.from(signature))) {
    return true;
  } else {
    logger.error('Slack signature verification failed');
    return false;
  }
}

export async function POST(req: NextRequest) {
  const bodyBuffer = await req.text();
  const isVerified = await verifySlackRequest(req, bodyBuffer);

  if (!isVerified) {
    return new NextResponse('Invalid Slack request signature', { status: 403 });
  }

  const payload = JSON.parse(bodyBuffer);

  // Handle URL verification challenge
  if (payload.type === 'url_verification') {
    return NextResponse.json({ challenge: payload.challenge });
  }

  // Process event
  if (payload.event && payload.event.type === 'reaction_added') {
    const { reaction, item, user: reactorUserId } = payload.event;

    // Check if the reaction is the one we care about (e.g., a specific emoji like 'bookmark')
    // This should be configurable per organization
    if (reaction === 'bookmark') { // TODO: Make this configurable via Integration settings
      logger.info({ reaction, item, reactorUserId }, 'Bookmark reaction detected');

      try {
        // Fetch the message or thread details
        const conversationHistory = await slackClient.conversations.replies({
          channel: item.channel,
          ts: item.ts,
          inclusive: true,
          limit: 100, // Adjust as needed
        });

        const messages = conversationHistory.messages;

        if (!messages || messages.length === 0) {
          logger.warn({ item }, 'No messages found for the reacted item');
          return new NextResponse('No messages found', { status: 200 });
        }

        const rootMessage = messages[0];
        const threadContent = messages.map(msg => ({
          author: msg.user ? `<@${msg.user}>` : 'Unknown',
          text: msg.text,
          timestamp: msg.ts,
        }));

        // Fetch channel info to get the channel name
        const channelInfo = await slackClient.conversations.info({
          channel: item.channel,
        });
        const channelName = channelInfo.channel?.name || 'Unknown';

        // Find the organization associated with the Slack integration
        // This requires a way to link Slack workspace to an Organization in our DB
        // For now, we'll assume a single organization or fetch based on a configured integration
        const integration = await prisma.integration.findFirst({
          where: {
            type: 'SLACK',
            // In a real scenario, you'd match by Slack Team ID or similar
            // For now, we'll just pick the first one or require a specific config
          },
          select: { organizationId: true },
        });

        if (!integration) {
          logger.error('No Slack integration found in DB');
          return new NextResponse('No Slack integration configured', { status: 200 });
        }

        const organizationId = integration.organizationId;

        // Add job to queue for background processing
        await slackQueue.add('processSlackMessage', {
          organizationId: organizationId,
          threadId: item.ts,
          channelId: item.channel,
          channelName: channelName,
          reactorUserId: reactorUserId,
          rootMessageAuthor: rootMessage.user ? `<@${rootMessage.user}>` : 'Unknown',
          messages: threadContent,
          rootMessageText: rootMessage.text ? rootMessage.text.substring(0, 250) : 'Slack Thread',
        });

        logger.info({ threadId: item.ts }, 'Slack message processing job added to queue.');
        return new NextResponse('Event received and queued', { status: 202 });

      } catch (error) {
        logger.error({ error }, 'Error processing Slack reaction event');
        return new NextResponse('Error processing event', { status: 500 });
      }
    }
  }

  return new NextResponse('Event type not handled', { status: 200 });
}
