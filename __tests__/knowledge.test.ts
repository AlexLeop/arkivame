import { createKnowledgeItem } from '../lib/knowledge';
import { prisma } from '@/lib/db';
import { generateSummary, generateEmbedding } from '@/lib/openai';
import logger from '@/lib/logger';
import { SourceType } from '@prisma/client';

// Mock dependencies
jest.mock('@/lib/db', () => ({
  prisma: {
    knowledgeItem: {
      create: jest.fn(),
    },
    $executeRaw: jest.fn(),
  },
}));

jest.mock('@/lib/openai', () => ({
  generateSummary: jest.fn(),
  generateEmbedding: jest.fn(),
}));

jest.mock('@/lib/logger');

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

    const textForEmbedding = `${input.title}\n${JSON.stringify(input.content)}`;

    expect(mockedGenerateSummary).toHaveBeenCalledWith(input.content);
    expect(mockedGenerateEmbedding).toHaveBeenCalledWith(textForEmbedding);

    // Check create call (without embedding)
    expect(mockedPrismaCreate).toHaveBeenCalledWith({
      data: {
        ...input,
        summary: mockSummary,
      },
    });

    // Check raw query update call
    expect(mockedPrismaExecuteRaw).toHaveBeenCalledTimes(1);
    expect(mockedPrismaExecuteRaw).toHaveBeenCalledWith(
      expect.anything(), `[${mockEmbedding.join(',')}]`, mockNewItem.id
    );

    expect(result).toEqual(mockNewItem);
  });

  it('should re-throw an error if summary generation fails', async () => {
    const error = new Error('Summary failed');
    mockedGenerateSummary.mockRejectedValue(error);
    mockedGenerateEmbedding.mockResolvedValue([0.1, 0.2, 0.3]);

    await expect(createKnowledgeItem(input)).rejects.toThrow(error);
    expect(mockedPrismaCreate).not.toHaveBeenCalled();
    expect(mockedPrismaExecuteRaw).not.toHaveBeenCalled();
  });

  it('should re-throw an error if embedding generation fails', async () => {
    const error = new Error('Embedding failed');
    mockedGenerateSummary.mockResolvedValue('A summary');
    mockedGenerateEmbedding.mockRejectedValue(error);

    await expect(createKnowledgeItem(input)).rejects.toThrow(error);
    expect(mockedPrismaCreate).not.toHaveBeenCalled();
    expect(mockedPrismaExecuteRaw).not.toHaveBeenCalled();
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

    await expect(createKnowledgeItem(input)).rejects.toThrow(error);
    expect(mockedPrismaCreate).toHaveBeenCalledTimes(1);
  });
});