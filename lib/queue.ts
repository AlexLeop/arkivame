import { Queue } from 'bullmq';
import { Redis } from '@upstash/redis';
import logger from '@/lib/logger';

const { UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN } = process.env;

// Reutiliza a lógica de conexão Redis do rate-limit
const connection =
  UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: UPSTASH_REDIS_REST_URL,
        token: UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

if (!connection) {
  logger.warn('Queue system is disabled. UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are not configured.');
}

// Define a estrutura de dados do trabalho de arquivamento
export type KnowledgeArchivalJobData =
  | {
      source: 'SLACK';
      payload: {
        teamId: string;
        channelId: string;
        threadTs: string;
        reactingUserId: string; // Slack User ID
      };
    }
  | {
      source: 'DISCORD';
      payload: {
        guildId: string;
        channelId: string; // ID do canal/thread a ser arquivado
        reactingUserId: string; // ID do usuário do Discord que invocou o comando
      };
    };

type InvitationPayload = {
  organizationName: string;
  inviterName: string;
  inviteLink: string;
};

type LimitWarningPayload = {
  organizationName: string;
  feature: string;
  usage: number;
  limit: number;
  upgradeLink: string;
};

// Discriminated union for type-safe email job data
export type EmailJobData =
  | {
      template: 'invitation';
      recipientEmail: string;
      payload: InvitationPayload;
    }
  | {
      template: 'limit-warning';
      recipientEmail: string;
      payload: LimitWarningPayload;
    };

// Cria e exporta a fila de arquivamento
export const knowledgeQueue = connection
  ? new Queue<KnowledgeArchivalJobData>('knowledge-archival', { connection })
  : null;

// Cria e exporta a fila de e-mails
export const emailQueue = connection
  ? new Queue<EmailJobData>('email-sending', { connection })
  : null;

export async function addKnowledgeArchivalJob(data: KnowledgeArchivalJobData) {
  if (!knowledgeQueue) throw new Error('Fila não inicializada.');

  let jobName: string;
  switch (data.source) {
    case 'SLACK':
      jobName = 'archive-slack-thread';
      break;
    case 'DISCORD':
      jobName = 'archive-discord-thread';
      break;
    default:
      throw new Error('Fonte de trabalho de arquivamento desconhecida.');
  }

  await knowledgeQueue.add(jobName, data, {
    removeOnComplete: true, // Mantém a fila limpa
    removeOnFail: 1000,     // Mantém trabalhos com falha para inspeção
  });
}

export async function addEmailJob(data: EmailJobData) {
  if (!emailQueue) throw new Error('Fila de e-mail não inicializada.');

  await emailQueue.add('send-email', data, {
    attempts: 3, // Tenta reenviar até 3 vezes em caso de falha
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: true,
    removeOnFail: 5000, // Mantém trabalhos com falha por mais tempo para depuração
  });
}