import { POST } from '@/app/api/suggestions/route';
import { findRelevantArchivedItems } from '@/lib/suggestions';

// Mock the suggestions service
jest.mock('@/lib/suggestions', () => ({
  findRelevantArchivedItems: jest.fn(),
}));

// Mock the logger to prevent console output during tests
jest.mock('@/lib/logger', () => ({
  error: jest.fn(),
}));

const mockedFindRelevantArchivedItems = findRelevantArchivedItems as jest.Mock;

describe('/api/suggestions POST', () => {
  beforeEach(() => {
    // Clear mocks before each test
    mockedFindRelevantArchivedItems.mockClear();
  });

  it('should return 200 and suggestions on a valid request', async () => {
    const mockSuggestions = [{ id: '1', title: 'Suggestion 1', similarity: 0.8 }];
    mockedFindRelevantArchivedItems.mockResolvedValue(mockSuggestions);

    const requestBody = {
      content: 'How to configure Stripe?',
      organizationId: 'org-123',
    };

    const request = new Request('http://localhost/api/suggestions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const responseBody = await response.json();

    expect(response.status).toBe(200);
    expect(responseBody).toEqual(mockSuggestions);
    expect(mockedFindRelevantArchivedItems).toHaveBeenCalledWith(
      requestBody.content,
      requestBody.organizationId
    );
    expect(mockedFindRelevantArchivedItems).toHaveBeenCalledTimes(1);
  });

  it('should return 400 if organizationId is missing', async () => {
    const requestBody = { content: 'Some content' }; // Missing organizationId

    const request = new Request('http://localhost/api/suggestions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const responseBody = await response.json();

    expect(response.status).toBe(400);
    expect(responseBody).toEqual({
      error: 'organizationId is required and must be a string.',
    });
    expect(mockedFindRelevantArchivedItems).not.toHaveBeenCalled();
  });

  it('should return 400 if content is missing or empty', async () => {
    const requestBody = { organizationId: 'org-123', content: '  ' }; // Whitespace content

    const request = new Request('http://localhost/api/suggestions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const responseBody = await response.json();

    expect(response.status).toBe(400);
    expect(responseBody).toEqual({
      error: 'Content is required and must be a non-empty string.',
    });
    expect(mockedFindRelevantArchivedItems).not.toHaveBeenCalled();
  });

  it('should return 500 if the service throws an error', async () => {
    const error = new Error('Service failure');
    mockedFindRelevantArchivedItems.mockRejectedValue(error);

    const requestBody = {
      content: 'A valid question',
      organizationId: 'org-123',
    };

    const request = new Request('http://localhost/api/suggestions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const responseBody = await response.json();

    expect(response.status).toBe(500);
    expect(responseBody).toEqual({ error: 'Internal Server Error' });
  });
});