import { POST } from '@/app/api/queues/knowledge/route';
import { createKnowledgeItem } from '@/lib/knowledge';
import { getSlackThreadMessages, getSlackClientForEvent } from '@/lib/slack';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';

// Mock das dependências
jest.mock('@/lib/knowledge');
jest.mock('@/lib/slack');
jest.mock('@/lib/db', () => ({
  prisma: {
    organization: { findFirst: jest.fn() },
    account: { findUnique: jest.fn() },
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

const mockedCreateKnowledgeItem = createKnowledgeItem as jest.Mock;
const mockedGetSlackThreadMessages = getSlackThreadMessages as jest.Mock;
const mockedGetSlackClientForEvent = getSlackClientForEvent as jest.Mock;
const mockedOrgFindFirst = prisma.organization.findFirst as jest.Mock;
const mockedAccountFindUnique = prisma.account.findUnique as jest.Mock;

describe('/api/queues/knowledge POST', () => {
  const validSecret = 'test-secret';
  process.env.KNOWLEDGE_QUEUE_SECRET = validSecret;

  const jobData = {
    teamId: 'T123',
    channelId: 'C456',
    threadTs: '1629876543.000100',
    reactingUserId: 'U_REACTING_USER', // Slack User ID
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedOrgFindFirst.mockResolvedValue({ id: 'org-123' });
    // Simula a busca bem-sucedida do usuário interno através do ID do Slack
    mockedAccountFindUnique.mockResolvedValue({
      provider: 'slack',
      providerAccountId: jobData.reactingUserId,
      user: {
        id: 'internal-user-id-abc',
        organizations: [{ organizationId: 'org-123' }],
      },
    });
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
      messages: [{ text: 'Hello world', user: 'U_ROOT_USER', ts: jobData.threadTs }],
      rootMessage: { text: 'Hello world', user: 'U_ROOT_USER', ts: jobData.threadTs },
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
    expect(mockedCreateKnowledgeItem).toHaveBeenCalledTimes(1);
    expect(mockedCreateKnowledgeItem).toHaveBeenCalledWith(expect.objectContaining({ organizationId: 'org-123', createdById: 'internal-user-id-abc' }));
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

    expect(response.status).toBe(200);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Slack API failed');
    expect(mockedCreateKnowledgeItem).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalled();
  });
});
