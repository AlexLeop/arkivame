import { prisma } from '@/lib/db';
import { KnowledgeItem } from './types';
import logger from './logger';

interface GetKnowledgeItemsParams {
  organizationId: string;
  limit?: number;
  offset?: number;
}

interface GetKnowledgeItemsResult {
  items: KnowledgeItem[];
  totalCount: number;
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * Fetches a paginated list of knowledge items for a given organization.
 *
 * @param {GetKnowledgeItemsParams} params - The parameters for fetching knowledge items.
 * @returns {Promise<GetKnowledgeItemsResult>} A promise that resolves to the list of items and the total count.
 */
export async function getKnowledgeItems({
  organizationId,
  limit = DEFAULT_LIMIT,
  offset = 0,
}: GetKnowledgeItemsParams): Promise<GetKnowledgeItemsResult> {
  try {
    // Garante que o limite esteja dentro de um intervalo razoável para evitar abuso
    const take = Math.min(limit, MAX_LIMIT);
    const skip = offset;

    const [items, totalCount] = await prisma.$transaction([
      prisma.knowledgeItem.findMany({
        where: { organizationId, status: 'PUBLISHED' },
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      }),
      prisma.knowledgeItem.count({
        where: { organizationId, status: 'PUBLISHED' },
      }),
    ]);

    return { items: items as KnowledgeItem[], totalCount };
  } catch (error) {
    logger.error({ err: error, organizationId, limit, offset }, 'Falha ao obter itens de conhecimento do banco de dados');
    throw new Error('Não foi possível recuperar os itens de conhecimento.');
  }
}