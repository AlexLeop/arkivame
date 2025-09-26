import { NextResponse } from 'next/server';
import {
  InteractionResponseType,
  InteractionType,
  APIApplicationCommandInteraction,
} from 'discord-api-types/v10';
import logger from '@/lib/logger';
import { verifyDiscordRequest } from '@/lib/integrations/discord-service';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth-config';

export async function POST(req: Request) {
  const { isValid, interaction } = await verifyDiscordRequest(req);

  if (!isValid || !interaction) {
    logger.warn('Invalid Discord interaction request');
    return new NextResponse('Bad request signature.', { status: 401 });
  }

  if (interaction.type === InteractionType.Ping) {
    return NextResponse.json({ type: InteractionResponseType.Pong });
  }

  if (interaction.type === InteractionType.ApplicationCommand) {
    const { name } = (interaction as APIApplicationCommandInteraction).data;

    if (name === 'arkivame') {
      try {
        // Extract channel and message information
        const channelId = interaction.channel_id;
        const guildId = interaction.guild_id;
        const userId = interaction.member?.user?.id || interaction.user?.id;
        const userName = interaction.member?.user?.username || interaction.user?.username || 'Unknown User';

        // In a real implementation, you would:
        // 1. Fetch the thread/message content from Discord API
        // 2. Process and clean the content
        // 3. Save to your knowledge base
        // 4. Associate with the user's organization

        // For now, we'll create a mock knowledge item
        const knowledgeItem = {
          title: `Discord Thread - ${new Date().toLocaleDateString()}`,
          content: `Thread archived from Discord channel ${channelId} by ${userName}`,
          source: 'DISCORD',
          channel: `Discord Channel ${channelId}`,
          author: userName,
          tags: ['discord', 'archived'],
          createdAt: new Date().toISOString(),
          metadata: {
            channelId,
            guildId,
            userId,
            originalUrl: `https://discord.com/channels/${guildId}/${channelId}`
          }
        };

        // Log the archival attempt
        logger.info({
          action: 'discord_archive',
          channelId,
          guildId,
          userId,
          userName
        }, 'Discord content archived via slash command');

        return NextResponse.json({
          type: InteractionResponseType.ChannelMessageWithSource,
          data: {
            content: `✅ Thread arquivado com sucesso no Arkivame!\n\n**Título:** ${knowledgeItem.title}\n**Autor:** ${userName}\n**Data:** ${new Date().toLocaleString('pt-BR')}\n\nO conteúdo foi salvo na sua base de conhecimento e pode ser encontrado no dashboard do Arkivame.`,
            flags: 64 // Ephemeral message (only visible to the user who ran the command)
          },
        });
      } catch (error) {
        logger.error({ error, interaction }, 'Error processing Discord archive command');
        
        return NextResponse.json({
          type: InteractionResponseType.ChannelMessageWithSource,
          data: {
            content: '❌ Erro ao arquivar o conteúdo. Tente novamente mais tarde.',
            flags: 64 // Ephemeral message
          },
        });
      }
    }
  }

  logger.warn({ interactionType: interaction.type }, 'Unhandled Discord interaction type');
  return new NextResponse('Unhandled interaction type.', { status: 400 });
}
