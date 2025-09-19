import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createKnowledgeItem } from '@/lib/knowledge';
import { KnowledgeArchivalJobData } from '@/lib/queue';
import { getSlackClientForEvent, getSlackThreadMessages } from '@/lib/slack';
import logger from '@/lib/logger';

// Esta função atua como o processador BullMQ para a fila 'knowledge-archival'.
// É acionada por um webhook de um serviço como Zeplo ou por um processo de worker separado.
export async function POST(request: Request) {
  // Autenticação: Garante que a requisição venha de uma fonte confiável
  const secret = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (secret !== process.env.KNOWLEDGE_QUEUE_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const job: { data: KnowledgeArchivalJobData } = await request.json();
  const { teamId, channelId, threadTs, reactingUserId } = job.data;

  try {
    // 1. Encontra a organização correspondente no banco de dados
    const organization = await prisma.organization.findFirst({
      where: {
        integrations: {
          some: { type: 'SLACK', AND: { config: { path: ['team_id'], equals: teamId } } },
        },
      },
    });
    if (!organization) {
      throw new Error(`Organization not found for Slack teamId: ${teamId}`);
    }

    // 2. Busca a conta do usuário com base no ID do Slack para encontrar o usuário interno.
    const account = await prisma.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider: 'slack', // Assumindo 'slack' como o nome do provedor no NextAuth
          providerAccountId: reactingUserId,
        },
      },
      include: {
        user: { include: { organizations: { where: { organizationId: organization.id } } } },
      },
    });

    const user = account?.user;
    if (!user || user.organizations.length === 0) {
      throw new Error(`User for Slack ID ${reactingUserId} not found or not part of organization ${organization.id}`);
    }

    // 3. Busca o conteúdo da thread do Slack
    const slack = getSlackClientForEvent(teamId);
    const { messages, rootMessage, channelName } = await getSlackThreadMessages(slack, channelId, threadTs);

    if (!messages || messages.length === 0 || !rootMessage) {
      logger.warn({ ...job.data }, 'No messages found for thread, skipping archival.');
      return NextResponse.json({ success: true, message: 'No messages to archive.' });
    }

    // 4. Usa o serviço `createKnowledgeItem` para criar o item com embedding
    const title = rootMessage.text.substring(0, 150);
    const content = messages.map((msg: any) => ({ author: msg.user, content: msg.text, timestamp: msg.ts }));

    await createKnowledgeItem({ organizationId: organization.id, createdById: user.id, title, content, sourceType: 'SLACK', channelId, channelName: channelName ?? 'unknown', rootMessageAuthor: rootMessage.user, threadId: threadTs, originalTimestamp: new Date(parseFloat(threadTs) * 1000) });

    logger.info({ ...job.data, organizationId: organization.id }, 'Successfully archived knowledge item.');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error({ err: error, jobData: job.data }, 'Failed to process knowledge archival job.');
    // Retorna 200 para evitar que a fila tente novamente um erro potencialmente irrecuperável.
    return NextResponse.json({ success: false, error: error.message }, { status: 200 });
  }
}