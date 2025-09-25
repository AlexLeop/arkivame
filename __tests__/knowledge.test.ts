import { createKnowledgeItem } from '../lib/knowledge';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';
import { SourceType } from '@prisma/client';

// Mock the entire @/lib/openai module at the top level
jest.mock('@/lib/openai', () => ({
  __esModule: true,
  generateSummary: jest.fn(() => Promise.resolve('Mocked Summary')),
  generateEmbedding: jest.fn(() => Promise.resolve([0.1, 0.2, 0.3])),
  extractActionItems: jest.fn(() => Promise.resolve(['Mocked Action Item 1'])),
  // Add other functions if they exist in lib/openai and are used by lib/knowledge
}));

// Now, import the mocked functions from the mocked @/lib/openai module
// These will be the jest.fn() instances defined in the mock above.
const { generateSummary, generateEmbedding, extractActionItems } = require('@/lib/openai');

// Mock dependencies
jest.mock('@/lib/db', () => ({
  prisma: {
    knowledgeItem: {
      create: jest.fn(),
    },
    $executeRaw: jest.fn(),
  },
}));



jest.mock('@/lib/logger', () => ({
  __esModule: true, // This is important for mocking ES modules
  default: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(), // Add info as well, just in case
  },
}));

const mockedPrismaCreate = prisma.knowledgeItem.create as jest.Mock;
const mockedPrismaExecuteRaw = prisma.$executeRaw as jest.Mock;
const mockedGenerateSummary = generateSummary as jest.Mock;
const mockedGenerateEmbedding = generateEmbedding as jest.Mock;

describe('Knowledge Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const input = {
    organizationId: 'org-123',
    createdById: 'user-abc',
    title: 'How to use Stripe?',
    content: [{ author: 'test', content: 'message' }],
    sourceType: 'SLACK' as SourceType,
  };

  it('should create a knowledge item with summary and embedding', async () => {
    const mockSummary = 'This is a summary.';
    const mockEmbedding = [0.1, 0.2, 0.3];
    const mockNewItem = { id: 'item-xyz', ...input, summary: mockSummary };

    mockedGenerateSummary.mockResolvedValue(mockSummary);
    mockedGenerateEmbedding.mockResolvedValue(mockEmbedding);
    mockedPrismaCreate.mockResolvedValue(mockNewItem);
    mockedPrismaExecuteRaw.mockResolvedValue(1); // Simulate 1 row updated

    const result = await createKnowledgeItem(input);

    const textForEmbedding = `${input.title}\n${input.content.map(msg => msg.content).join('\n')}`;

    expect(mockedGenerateSummary).toHaveBeenCalledWith(input.content);
    expect(mockedGenerateEmbedding).toHaveBeenCalledWith(textForEmbedding);

    // Check create call (without embedding)
    expect(mockedPrismaCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        ...input,
        summary: mockSummary,
        actionItems: ['Mocked Action Item 1'], // Add this as it's now generated
      }),
    });

    // Check raw query update call
    expect(mockedPrismaExecuteRaw).toHaveBeenCalledTimes(1);
    expect(mockedPrismaExecuteRaw).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.stringContaining('UPDATE knowledge_items'),
        expect.stringContaining('SET embedding = '),
        expect.stringContaining('::vector'),
        expect.stringContaining('WHERE id = '),
      ]),
      mockEmbedding,
      mockNewItem.id
    );

    expect(result).toEqual(mockNewItem);
  });

  it('should handle summary generation failure gracefully', async () => {
    const error = new Error('Summary failed');
    mockedGenerateSummary.mockRejectedValue(error);
    mockedGenerateEmbedding.mockResolvedValue([0.1, 0.2, 0.3]);
    mockedPrismaCreate.mockResolvedValue({ id: 'item-xyz', ...input, summary: 'Não foi possível gerar resumo.' });
    mockedPrismaExecuteRaw.mockResolvedValue(1);

    const result = await createKnowledgeItem(input);

    expect(result.summary).toBe('Não foi possível gerar resumo.');
    expect(mockedPrismaCreate).toHaveBeenCalledTimes(1);
    expect(mockedPrismaExecuteRaw).toHaveBeenCalledTimes(1);
  });

  it('should handle embedding generation failure gracefully', async () => {
    const error = new Error('Embedding failed');
    mockedGenerateSummary.mockResolvedValue('A summary');
    mockedGenerateEmbedding.mockRejectedValue(error);
    mockedPrismaCreate.mockResolvedValue({ id: 'item-xyz', ...input, summary: 'A summary' });
    mockedPrismaExecuteRaw.mockResolvedValue(1);

    const result = await createKnowledgeItem(input);

    // Expect the item to be created without an embedding, and the update query not to be called
    expect(mockedPrismaCreate).toHaveBeenCalledTimes(1);
    expect(mockedPrismaExecuteRaw).not.toHaveBeenCalled(); // Because embedding generation failed
    expect(result.summary).toBe('A summary');
  });

  it('should re-throw an error if database update fails', async () => {
    const error = new Error('DB update failed');
    const mockSummary = 'This is a summary.';
    const mockEmbedding = [0.1, 0.2, 0.3];
    const mockNewItem = { id: 'item-xyz', ...input, summary: mockSummary };

    mockedGenerateSummary.mockResolvedValue(mockSummary);
    mockedGenerateEmbedding.mockResolvedValue(mockEmbedding);
    mockedPrismaCreate.mockResolvedValue(mockNewItem);
    mockedPrismaExecuteRaw.mockRejectedValue(error);

    await expect(createKnowledgeItem(input)).rejects.toThrow('Failed to create knowledge item.');
    await expect(createKnowledgeItem(input)).rejects.toHaveProperty('cause', error);
    expect(mockedPrismaCreate).toHaveBeenCalledTimes(2); // Called once for each expect
  });
});