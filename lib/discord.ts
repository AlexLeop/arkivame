import nacl from 'tweetnacl';
import logger from './logger';

/**
 * Verifica a assinatura de uma requisição webhook do Discord.
 * @param request A requisição recebida.
 * @param rawBody O corpo bruto da requisição.
 * @returns {boolean} True se a assinatura for válida, false caso contrário.
 */
export async function verifyDiscordRequest(request: Request, rawBody: string): Promise<boolean> {
  const signature = request.headers.get('x-signature-ed25519');
  const timestamp = request.headers.get('x-signature-timestamp');
  const publicKey = process.env.DISCORD_PUBLIC_KEY;

  if (!signature || !timestamp || !publicKey) {
    logger.warn('Assinatura da requisição Discord ausente ou chave pública não configurada.');
    return false;
  }

  try {
    return nacl.sign.detached.verify(
      Buffer.from(timestamp + rawBody),
      Buffer.from(signature, 'hex'),
      Buffer.from(publicKey, 'hex')
    );
  } catch (error) {
    logger.error({ err: error }, 'Erro ao verificar a assinatura do Discord.');
    return false;
  }
}

// Tipos simplificados para interações do Discord
export const InteractionType = {
  PING: 1,
  APPLICATION_COMMAND: 2,
};

export const InteractionResponseType = {
  PONG: 1,
  CHANNEL_MESSAGE_WITH_SOURCE: 4,
  DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE: 5,
};

export interface DiscordInteraction {
  type: number;
  id: string;
  token: string;
  guild_id?: string;
  channel_id?: string;
  member?: {
    user: {
      id: string;
    };
  };
  data?: {
    name: string;
    id: string;
  };
}

/**
 * Função mock para buscar mensagens de uma thread do Discord.
 * Em uma implementação real, faria chamadas à API do Discord usando o channelId.
 */
export async function getDiscordThreadMessages(channelId: string) {
  logger.info(`[MOCK] Buscando mensagens para o canal/thread ${channelId}`);
  
  const rootMessage = {
    content: `Esta é a mensagem raiz da thread no canal ${channelId}`,
    author: { id: 'U_DISCORD_ROOT_USER' },
    timestamp: new Date().toISOString(),
  };
  const replyMessage = {
    content: 'Esta é uma resposta na thread.',
    author: { id: 'U_DISCORD_REPLY_USER' },
    timestamp: new Date().toISOString(),
  };

  return { messages: [rootMessage, replyMessage], rootMessage, channelName: 'mock-discord-channel' };
}