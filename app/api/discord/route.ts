import { NextResponse } from 'next/server';
import {
  InteractionResponseType,
  InteractionType,
  APIApplicationCommandInteraction,
} from 'discord-api-types/v10';
import logger from '@/lib/logger';
import { verifyDiscordRequest } from '@/lib/integrations/discord-service';

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
      // Placeholder response for the slash command.
      // Future logic will process the command and archive content.
      return NextResponse.json({
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
          content: 'Olá do Arkivame! Comando recebido e em breve esta thread será arquivada.',
        },
      });
    }
  }

  logger.warn({ interactionType: interaction.type }, 'Unhandled Discord interaction type');
  return new NextResponse('Unhandled interaction type.', { status: 400 });
}