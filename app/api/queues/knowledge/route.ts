import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { KnowledgeArchivalJobData } from '@/lib/queue';
import { getSlackClientForEvent, getSlackThreadMessages } from '@/lib/slack';
import { generateEmbedding } from '@/lib/openai';
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

  if (job.data.source !== 'SLACK') {
    // Atualmente, este worker só processa jobs do Slack
    const message = `Unsupported job source: ${job.data.source}`;
    logger.warn({ jobData: job.data }, message);
    return NextResponse.json({ success: false, error: message }, { status: 200 });
  }

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

    // 4. Prepara e cria o item de conhecimento com embedding
    const title = (rootMessage.text ?? '').substring(0, 150);
    const content = messages.map((msg: { user?: string, text?: string, ts?: string }) => ({ author: msg.user, content: msg.text, timestamp: msg.ts }));

    const textForEmbedding = content
      .map(msg => `${msg.author || 'unknown'}: ${msg.content || ''}`)
      .join('\n\n');
    const embedding = await generateEmbedding(textForEmbedding);

    // Convert content to JSON string for SQL insertion
    const contentJson = JSON.stringify(content);
    const timestamp = new Date(parseFloat(threadTs) * 1000);
    const rootAuthor = rootMessage.user ?? 'unknown';
    const channelNameValue = channelName ?? 'unknown';

    // Use raw SQL to insert with vector embedding
    await prisma.$executeRaw`
      INSERT INTO "KnowledgeItem" (
        "id",
        "organizationId",
        "createdById",
        "title",
        "content",
        "sourceType",
        "channelId",
        "channelName",
        "rootMessageAuthor",
        "threadId",
        "originalTimestamp",
        "embedding",
        "createdAt",
        "updatedAt"
      ) VALUES (
        gen_random_uuid(),
        ${organization.id}::uuid,
        ${user.id}::uuid,
        ${title},
        ${contentJson}::jsonb,
        'SLACK',
        ${channelId},
        ${channelNameValue},
        ${rootAuthor},
        ${threadTs},
        ${timestamp},
        ${JSON.stringify(embedding)}::jsonb,
        NOW(),
        NOW()
      )
    `;

    logger.info({ ...job.data, organizationId: organization.id }, 'Successfully archived knowledge item.');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error({ err: error, jobData: job.data }, 'Failed to process knowledge archival job.');

    // Diferencia erros para a fila de processamento.
    // Erros de "não encontrado" (not found) não devem ser repetidos.
    if (error.message.includes('not found')) {
      // Retorna 200 para confirmar o recebimento e evitar que a fila tente novamente.
      return NextResponse.json({ success: false, error: error.message }, { status: 200 });
    }

    // Para outros erros (ex: falha na API do Slack, problema de rede),
    // retorna 500 para que a fila possa tentar novamente.
    return NextResponse.json({ success: false, error: 'An unexpected error occurred. The job will be retried.' }, { status: 500 });
  }
}