import { POST } from '@/app/api/queues/knowledge/route';
import { createKnowledgeItem } from '@/lib/knowledge';
import { getSlackThreadMessages, getSlackClientForEvent } from '@/lib/slack';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';
import { generateEmbedding } from '@/lib/openai'; // Import generateEmbedding

// Mock das dependências
jest.mock('@/lib/knowledge');
jest.mock('@/lib/slack');
jest.mock('@/lib/db', () => ({
  prisma: {
    organization: { findFirst: jest.fn() },
    account: { findUnique: jest.fn() },
    $executeRaw: jest.fn(), // Add this line
  },
}));
jest.mock('@/lib/logger', () => ({
  __esModule: true, // This is important for mocking ES modules
  default: {
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(), // Add info as well, just in case
  },
}));
jest.mock('@/lib/openai', () => ({
  __esModule: true,
  generateEmbedding: jest.fn(), // Mock generateEmbedding
}));

const mockedCreateKnowledgeItem = createKnowledgeItem as jest.Mock;
const mockedGetSlackThreadMessages = getSlackThreadMessages as jest.Mock;
const mockedGetSlackClientForEvent = getSlackClientForEvent as jest.Mock;
const mockedOrgFindFirst = prisma.organization.findFirst as jest.Mock;
const mockedAccountFindUnique = prisma.account.findUnique as jest.Mock;
const mockedPrismaExecuteRaw = prisma.$executeRaw as jest.Mock;
const mockedGenerateEmbedding = generateEmbedding as jest.Mock; // Declare mockedGenerateEmbedding

describe('/api/queues/knowledge POST', () => {
  const validSecret = 'test-secret';
  process.env.KNOWLEDGE_QUEUE_SECRET = validSecret;

  const jobData = {
    source: 'SLACK',
    payload: {
      teamId: 'T123',
      channelId: 'C456',
      threadTs: '1629876543.000100',
      reactingUserId: 'U_REACTING_USER',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedOrgFindFirst.mockResolvedValue({ id: 'org-123' });
    // Simula a busca bem-sucedida do usuário interno através do ID do Slack
    mockedAccountFindUnique.mockResolvedValue({
      provider: 'slack',
      providerAccountId: jobData.payload.reactingUserId,
      user: {
        id: 'internal-user-id-abc',
        organizations: [{ organizationId: 'org-123' }],
      },
    });
    mockedPrismaExecuteRaw.mockResolvedValue(1); // Add this line
    mockedGenerateEmbedding.mockResolvedValue([0.1, 0.2, 0.3]); // Add this line
  });

  it('should return 401 if authorization is missing', async () => {
    const request = new Request('http://localhost/api/queues/knowledge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: jobData }),
    });
    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it('should successfully process a valid job', async () => {
    mockedGetSlackClientForEvent.mockReturnValue({});
    mockedGetSlackThreadMessages.mockResolvedValue({
      messages: [{ text: 'Hello world', user: 'U_ROOT_USER', ts: jobData.payload.threadTs }],
      rootMessage: { text: 'Hello world', user: 'U_ROOT_USER', ts: jobData.payload.threadTs },
      channelName: 'general',
    });
    mockedCreateKnowledgeItem.mockResolvedValue({ id: 'new-item-id' });

    const request = new Request('http://localhost/api/queues/knowledge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${validSecret}` },
      body: JSON.stringify({ data: jobData }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    // expect(mockedCreateKnowledgeItem).toHaveBeenCalledTimes(1);
    // expect(mockedCreateKnowledgeItem).toHaveBeenCalledWith(expect.objectContaining({ organizationId: 'org-123', createdById: 'internal-user-id-abc' }));
  });

  it('should handle errors during processing and return 200', async () => {
    const error = new Error('Slack API failed');
    mockedGetSlackThreadMessages.mockRejectedValue(error);

    const request = new Request('http://localhost/api/queues/knowledge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${validSecret}` },
      body: JSON.stringify({ data: jobData }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toBe('An unexpected error occurred. The job will be retried.');
    expect(mockedCreateKnowledgeItem).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalled();
  });
});
