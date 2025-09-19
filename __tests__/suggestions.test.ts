import { findRelevantArchivedItems, SuggestedItem } from '@/lib/suggestions';
import { generateEmbedding } from '@/lib/openai';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';

// Mock das dependências
jest.mock('@/lib/openai', () => ({
  generateEmbedding: jest.fn(),
}));

jest.mock('@/lib/db', () => ({
  prisma: {
    $queryRaw: jest.fn(),
  },
}));

jest.mock('@/lib/logger', () => ({
  error: jest.fn(),
}));

// Tipando os mocks para ter autocomplete e type safety
const mockedGenerateEmbedding = generateEmbedding as jest.Mock;
const mockedPrismaQueryRaw = prisma.$queryRaw as jest.Mock;
const mockedLoggerError = logger.error as jest.Mock;

describe('Suggestion Service', () => {
  const organizationId = 'org-123';
  const sampleContent = 'Como configuro a integração com o Stripe?';

  beforeEach(() => {
    // Limpa os mocks antes de cada teste
    mockedGenerateEmbedding.mockClear();
    mockedPrismaQueryRaw.mockClear();
    mockedLoggerError.mockClear();
  });

  it('should find relevant items for a given content', async () => {
    const mockEmbedding = [0.1, 0.2, 0.3];
    const mockResults: SuggestedItem[] = [
      {
        id: 'item-1',
        title: 'Guia de Integração Stripe',
        similarity: 0.9,
        channelName: 'dev',
        rootMessageAuthor: 'John Doe',
      },
      {
        id: 'item-2',
        title: 'Configurando Webhooks',
        similarity: 0.8,
        channelName: 'general',
        rootMessageAuthor: 'Jane Doe',
      },
    ];

    mockedGenerateEmbedding.mockResolvedValue(mockEmbedding);
    mockedPrismaQueryRaw.mockResolvedValue(mockResults);

    const items = await findRelevantArchivedItems(sampleContent, organizationId);

    expect(mockedGenerateEmbedding).toHaveBeenCalledWith(sampleContent);
    expect(mockedGenerateEmbedding).toHaveBeenCalledTimes(1);

    expect(mockedPrismaQueryRaw).toHaveBeenCalledTimes(1);
    // Verificar se a query SQL foi chamada com os parâmetros corretos é mais complexo
    // e pode ser frágil. Aqui, focamos no fluxo e no resultado.

    expect(items).toEqual(mockResults);
  });

  it('should return an empty array if no relevant items are found', async () => {
    const mockEmbedding = [0.4, 0.5, 0.6];
    mockedGenerateEmbedding.mockResolvedValue(mockEmbedding);
    mockedPrismaQueryRaw.mockResolvedValue([]); // Simula o DB não retornando nada

    const items = await findRelevantArchivedItems(sampleContent, organizationId);

    expect(items).toEqual([]);
    expect(mockedGenerateEmbedding).toHaveBeenCalledWith(sampleContent);
    expect(mockedPrismaQueryRaw).toHaveBeenCalledTimes(1);
  });

  it('should return an empty array and log an error if embedding generation fails', async () => {
    const embeddingError = new Error('Embedding API failed');
    mockedGenerateEmbedding.mockRejectedValue(embeddingError);

    const items = await findRelevantArchivedItems(sampleContent, organizationId);

    expect(items).toEqual([]);
    expect(mockedLoggerError).toHaveBeenCalledWith(
      expect.objectContaining({ err: embeddingError, message: 'Falha ao encontrar itens arquivados relevantes' }),
      'Falha ao encontrar itens arquivados relevantes'
    );
    expect(mockedPrismaQueryRaw).not.toHaveBeenCalled();
  });

  it('should return an empty array and log an error if the database query fails', async () => {
    const dbError = new Error('Database query failed');
    const mockEmbedding = [0.7, 0.8, 0.9];
    mockedGenerateEmbedding.mockResolvedValue(mockEmbedding);
    mockedPrismaQueryRaw.mockRejectedValue(dbError);

    const items = await findRelevantArchivedItems(sampleContent, organizationId);

    expect(items).toEqual([]);
    expect(mockedLoggerError).toHaveBeenCalledWith(
      expect.objectContaining({ err: dbError, message: 'Falha ao encontrar itens arquivados relevantes' }),
      'Falha ao encontrar itens arquivados relevantes'
    );
  });

  it('should return an empty array for empty or whitespace-only content', async () => {
    const items = await findRelevantArchivedItems('   ', organizationId);
    expect(items).toEqual([]);
    expect(mockedGenerateEmbedding).not.toHaveBeenCalled();
    expect(mockedPrismaQueryRaw).not.toHaveBeenCalled();
  });
});