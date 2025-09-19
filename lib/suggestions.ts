import { prisma } from '@/lib/db';
import { generateEmbedding } from '@/lib/openai';
import logger from '@/lib/logger';

// Supondo que a tabela 'ArchivedItem' tenha uma coluna de vetor 'embedding'
// e que a extensão pgvector esteja habilitada no PostgreSQL.

/**
 * Define a estrutura do objeto de sugestão retornado pela busca por similaridade.
 */
export type SuggestedItem = {
  id: string;
  title: string;
  channelName: string;
  rootMessageAuthor: string;
  similarity: number;
};

const SIMILARITY_THRESHOLD = 0.75; // Limiar de similaridade (cosseno)
const MAX_RESULTS = 3; // Máximo de resultados a serem retornados

/**
 * Encontra itens arquivados relevantes para uma nova mensagem com base na similaridade semântica.
 *
 * @param content O conteúdo da nova mensagem/pergunta.
 * @param organizationId O ID da organização para buscar os itens.
 * @returns Uma promessa que resolve para uma lista de itens arquivados relevantes.
 */
export async function findRelevantArchivedItems(
  content: string,
  organizationId: string
): Promise<SuggestedItem[]> {
  if (!content.trim()) {
    return [];
  }

  try {
    // 1. Gerar o embedding para o novo conteúdo
    const queryEmbedding = await generateEmbedding(content);
    // pgvector espera o vetor como uma string no formato '[1,2,3]'
    const vectorQuery = JSON.stringify(queryEmbedding);

    // 2. Buscar no banco de dados por vetores similares
    // A sintaxe exata pode variar dependendo da configuração do Prisma e pgvector.
    // Usamos a distância de cosseno (1 - similaridade de cosseno) para a busca.
    // '<=>' é o operador de distância de cosseno do pgvector.
    const results: SuggestedItem[] = await prisma.$queryRaw`
      SELECT
        id,
        title,
        "channelName",
        "rootMessageAuthor",
        (1 - (embedding <=> ${vectorQuery}::vector)) AS similarity
      FROM "knowledge_items"
      WHERE "organizationId" = ${organizationId} AND "embedding" IS NOT NULL
        AND (1 - (embedding <=> ${vectorQuery}::vector)) > ${SIMILARITY_THRESHOLD}
      ORDER BY similarity DESC
      LIMIT ${MAX_RESULTS};
    `;

    return results;
  } catch (error) {
    logger.error(
      { err: error, message: 'Falha ao encontrar itens arquivados relevantes', organizationId },
      'Falha ao encontrar itens arquivados relevantes'
    );
    // Não lançar o erro para não quebrar o fluxo do bot, apenas retorna um array vazio.
    return [];
  }
}