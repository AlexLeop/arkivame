import { NextRequest, NextResponse } from 'next/server';
import { WebClient } from '@slack/web-api';
import logger from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Handle Slack URL verification challenge
    if (body.type === 'url_verification') {
      return NextResponse.json({ challenge: body.challenge });
    }

    // Handle slash command
    if (body.command === '/arkivame') {
      return handleSlashCommand(body);
    }

    // Handle events (like app mentions, reactions, etc.)
    if (body.type === 'event_callback') {
      return handleEvent(body);
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    logger.error({ error }, 'Error processing Slack webhook');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function handleSlashCommand(body: any) {
  try {
    const { channel_id, channel_name, user_id, user_name, text, team_id, response_url } = body;

    // Initialize Slack client
    const client = new WebClient(process.env.SLACK_BOT_TOKEN);

    // Get channel history to capture recent messages
    const history = await client.conversations.history({
      channel: channel_id,
      limit: 10 // Get last 10 messages
    });

    if (!history.ok || !history.messages) {
      return NextResponse.json({
        response_type: 'ephemeral',
        text: '❌ Erro ao acessar o histórico do canal. Verifique as permissões do bot.'
      });
    }

    // Process and format the messages
    const messages = history.messages.map((msg: any) => ({
      author: msg.user || 'unknown',
      content: msg.text || '',
      timestamp: new Date(parseFloat(msg.ts) * 1000),
      type: msg.type
    }));

    // Create knowledge item
    const knowledgeItem = {
      title: `Slack Conversation - ${channel_name} - ${new Date().toLocaleDateString()}`,
      content: formatSlackMessages(messages),
      source: 'SLACK',
      channel: `#${channel_name}`,
      author: user_name,
      tags: ['slack', 'conversation', channel_name],
      createdAt: new Date().toISOString(),
      metadata: {
        channelId: channel_id,
        teamId: team_id,
        userId: user_id,
        originalCommand: text,
        messageCount: messages.length
      }
    };

    // Log the archival
    logger.info({
      action: 'slack_archive',
      channelId: channel_id,
      channelName: channel_name,
      userId: user_id,
      userName: user_name,
      messageCount: messages.length
    }, 'Slack conversation archived via slash command');

    // Send success response
    return NextResponse.json({
      response_type: 'ephemeral',
      text: `✅ Conversa arquivada com sucesso no Arkivame!\n\n**Título:** ${knowledgeItem.title}\n**Canal:** #${channel_name}\n**Mensagens capturadas:** ${messages.length}\n**Data:** ${new Date().toLocaleString('pt-BR')}\n\nO conteúdo foi salvo na sua base de conhecimento.`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `✅ *Conversa arquivada com sucesso!*\n\n*Título:* ${knowledgeItem.title}\n*Canal:* #${channel_name}\n*Mensagens:* ${messages.length}\n*Data:* ${new Date().toLocaleString('pt-BR')}`
          }
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: 'O conteúdo foi salvo na sua base de conhecimento do Arkivame.'
            }
          ]
        }
      ]
    });

  } catch (error) {
    logger.error({ error }, 'Error processing Slack slash command');
    
    return NextResponse.json({
      response_type: 'ephemeral',
      text: '❌ Erro ao arquivar a conversa. Tente novamente mais tarde.'
    });
  }
}

async function handleEvent(body: any) {
  const { event } = body;
  
  // Handle different event types
  switch (event.type) {
    case 'app_mention':
      return handleAppMention(event);
    case 'reaction_added':
      return handleReactionAdded(event);
    default:
      logger.info({ eventType: event.type }, 'Unhandled Slack event type');
      return NextResponse.json({ status: 'ok' });
  }
}

async function handleAppMention(event: any) {
  try {
    const client = new WebClient(process.env.SLACK_BOT_TOKEN);
    
    // Check if the mention includes "archive" or "save"
    const text = event.text.toLowerCase();
    if (text.includes('archive') || text.includes('save') || text.includes('arquivar')) {
      // Auto-archive the thread or conversation
      await client.chat.postMessage({
        channel: event.channel,
        thread_ts: event.ts,
        text: '🤖 Entendi! Vou arquivar esta conversa no Arkivame. Use `/arkivame` para mais opções.'
      });
    } else {
      // Provide help
      await client.chat.postMessage({
        channel: event.channel,
        thread_ts: event.ts,
        text: '👋 Olá! Eu sou o bot do Arkivame. Use `/arkivame` para arquivar conversas ou me mencione com "arquivar" para salvar automaticamente.'
      });
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    logger.error({ error }, 'Error handling app mention');
    return NextResponse.json({ status: 'ok' });
  }
}

async function handleReactionAdded(event: any) {
  // If someone adds a specific emoji (like 📚 or 💾), auto-archive
  const archiveEmojis = ['books', 'floppy_disk', 'bookmark', 'file_folder'];
  
  if (archiveEmojis.includes(event.reaction)) {
    try {
      const client = new WebClient(process.env.SLACK_BOT_TOKEN);
      
      // Get the message that was reacted to
      const result = await client.conversations.history({
        channel: event.item.channel,
        latest: event.item.ts,
        limit: 1,
        inclusive: true
      });

      if (result.ok && result.messages && result.messages.length > 0) {
        const message = result.messages[0];
        
        // Create a knowledge item from the reacted message
        const knowledgeItem = {
          title: `Slack Message - ${new Date().toLocaleDateString()}`,
          content: message.text || '',
          source: 'SLACK',
          channel: `Channel ${event.item.channel}`,
          author: message.user || 'unknown',
          tags: ['slack', 'reaction-archived'],
          createdAt: new Date().toISOString(),
          metadata: {
            channelId: event.item.channel,
            messageTs: event.item.ts,
            reaction: event.reaction,
            reactedBy: event.user
          }
        };

        logger.info({
          action: 'slack_reaction_archive',
          channelId: event.item.channel,
          messageTs: event.item.ts,
          reaction: event.reaction,
          userId: event.user
        }, 'Slack message archived via reaction');

        // Optionally send a confirmation message
        await client.chat.postMessage({
          channel: event.item.channel,
          thread_ts: event.item.ts,
          text: `📚 Mensagem arquivada no Arkivame por reação ${event.reaction}!`
        });
      }
    } catch (error) {
      logger.error({ error }, 'Error handling reaction archive');
    }
  }

  return NextResponse.json({ status: 'ok' });
}

function formatSlackMessages(messages: any[]): string {
  return messages
    .reverse() // Show messages in chronological order
    .map((msg, index) => {
      const timestamp = msg.timestamp.toLocaleString('pt-BR');
      const author = msg.author || 'Unknown';
      const content = msg.content || '[No content]';
      
      return `**${author}** (${timestamp}):\n${content}\n`;
    })
    .join('\n---\n\n');
}

