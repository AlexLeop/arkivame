import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Handle Mattermost slash command
    if (body.command === '/arkivame') {
      return handleSlashCommand(body);
    }
    
    // Handle webhook events
    if (body.event) {
      return handleWebhookEvent(body);
    }
    
    return NextResponse.json({ text: 'OK' });
  } catch (error) {
    logger.error({ error }, 'Error processing Mattermost webhook');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function handleSlashCommand(body: any) {
  try {
    const { 
      channel_id, 
      channel_name, 
      user_id, 
      user_name, 
      text, 
      team_id, 
      team_domain,
      response_url 
    } = body;

    // In a real implementation, you would fetch recent messages from Mattermost API
    // For now, we'll create a mock knowledge item
    const knowledgeItem = {
      title: `Mattermost Conversation - ${channel_name} - ${new Date().toLocaleDateString()}`,
      content: `Conversa arquivada do canal ${channel_name} por ${user_name}.\n\nComando executado: ${text || 'Arquivar conversa'}`,
      source: 'MATTERMOST',
      channel: `~${channel_name}`,
      author: user_name,
      tags: ['mattermost', 'conversation', channel_name],
      createdAt: new Date().toISOString(),
      metadata: {
        channelId: channel_id,
        teamId: team_id,
        teamDomain: team_domain,
        userId: user_id,
        originalCommand: text
      }
    };

    // Log the archival
    logger.info({
      action: 'mattermost_archive',
      channelId: channel_id,
      channelName: channel_name,
      userId: user_id,
      userName: user_name,
      teamDomain: team_domain
    }, 'Mattermost conversation archived via slash command');

    // Return response in Mattermost format
    return NextResponse.json({
      response_type: 'ephemeral',
      text: `✅ Conversa arquivada com sucesso no Arkivame!`,
      attachments: [
        {
          color: 'good',
          title: 'Arquivamento Concluído',
          fields: [
            {
              title: 'Título',
              value: knowledgeItem.title,
              short: false
            },
            {
              title: 'Canal',
              value: `~${channel_name}`,
              short: true
            },
            {
              title: 'Autor',
              value: user_name,
              short: true
            },
            {
              title: 'Data',
              value: new Date().toLocaleString('pt-BR'),
              short: true
            },
            {
              title: 'Team',
              value: team_domain,
              short: true
            }
          ],
          footer: 'Arkivame',
          footer_icon: 'https://arkivame.com/icon.png',
          ts: Math.floor(Date.now() / 1000)
        }
      ]
    });

  } catch (error) {
    logger.error({ error }, 'Error processing Mattermost slash command');
    
    return NextResponse.json({
      response_type: 'ephemeral',
      text: '❌ Erro ao arquivar a conversa. Tente novamente mais tarde.'
    });
  }
}

async function handleWebhookEvent(body: any) {
  try {
    const { event, data } = body;
    
    switch (event) {
      case 'post_created':
        return handlePostCreated(data);
      case 'reaction_added':
        return handleReactionAdded(data);
      default:
        logger.info({ eventType: event }, 'Unhandled Mattermost event type');
        return NextResponse.json({ text: 'OK' });
    }
  } catch (error) {
    logger.error({ error }, 'Error handling Mattermost webhook event');
    return NextResponse.json({ text: 'OK' });
  }
}

async function handlePostCreated(data: any) {
  const { post, channel_name, team_name, user_name } = data;
  
  // Check if the post mentions the bot or contains archive keywords
  const message = post.message || '';
  const shouldArchive = message.toLowerCase().includes('@arkivame') ||
                       message.toLowerCase().includes('archive') ||
                       message.toLowerCase().includes('arquivar');
  
  if (shouldArchive) {
    // Create knowledge item
    const knowledgeItem = {
      title: `Mattermost Post - ${channel_name} - ${new Date().toLocaleDateString()}`,
      content: formatMattermostPost(post, user_name),
      source: 'MATTERMOST',
      channel: `~${channel_name}`,
      author: user_name,
      tags: ['mattermost', 'auto-archived'],
      createdAt: new Date().toISOString(),
      metadata: {
        postId: post.id,
        channelId: post.channel_id,
        channelName: channel_name,
        teamName: team_name,
        userId: post.user_id,
        originalMessage: message
      }
    };

    logger.info({
      action: 'mattermost_auto_archive',
      postId: post.id,
      channelName: channel_name,
      teamName: team_name,
      userId: post.user_id
    }, 'Mattermost post auto-archived');

    // In a real implementation, you might want to reply to the post
    // confirming the archival
  }
  
  return NextResponse.json({ text: 'OK' });
}

async function handleReactionAdded(data: any) {
  const { reaction, post, channel_name, user_name } = data;
  
  // Archive posts that receive specific reactions
  const archiveReactions = ['bookmark', 'file_folder', 'books', 'floppy_disk'];
  
  if (archiveReactions.includes(reaction.emoji_name)) {
    const knowledgeItem = {
      title: `Mattermost Post - ${channel_name} - ${new Date().toLocaleDateString()}`,
      content: formatMattermostPost(post, post.user_name || 'Unknown'),
      source: 'MATTERMOST',
      channel: `~${channel_name}`,
      author: post.user_name || 'Unknown',
      tags: ['mattermost', 'reaction-archived'],
      createdAt: new Date().toISOString(),
      metadata: {
        postId: post.id,
        channelId: post.channel_id,
        channelName: channel_name,
        reaction: reaction.emoji_name,
        reactedBy: user_name,
        archivedViaReaction: true
      }
    };

    logger.info({
      action: 'mattermost_reaction_archive',
      postId: post.id,
      channelName: channel_name,
      reaction: reaction.emoji_name,
      reactedBy: user_name
    }, 'Mattermost post archived via reaction');
  }
  
  return NextResponse.json({ text: 'OK' });
}

function formatMattermostPost(post: any, userName: string): string {
  const timestamp = new Date(post.create_at).toLocaleString('pt-BR');
  const message = post.message || '[No content]';
  
  let formatted = `**${userName}** (${timestamp}):\n${message}\n`;
  
  // Add file attachments if any
  if (post.file_ids && post.file_ids.length > 0) {
    formatted += '\n**Anexos:**\n';
    post.file_ids.forEach((fileId: string, index: number) => {
      formatted += `${index + 1}. Arquivo ID: ${fileId}\n`;
    });
  }
  
  // Add metadata if available
  if (post.props && Object.keys(post.props).length > 0) {
    formatted += '\n**Metadados:**\n';
    Object.entries(post.props).forEach(([key, value]) => {
      formatted += `${key}: ${value}\n`;
    });
  }
  
  return formatted;
}

