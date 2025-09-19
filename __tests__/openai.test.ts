import {
  generateSummary,
  extractActionItems,
  detectTopics,
  improveSearchQuery,
  generateEmbedding,
} from '../lib/openai';
import logger from '../lib/logger';

// Mock da biblioteca OpenAI
const mockCreateChatCompletion = jest.fn();
const mockCreateEmbedding = jest.fn();

jest.mock('openai', () => {
  // O mock precisa ser uma classe que pode ser instanciada com 'new'
  return jest.fn().mockImplementation(() => {
    return {
      chat: {
        completions: {
          create: mockCreateChatCompletion,
        },
      },
      embeddings: {
        create: mockCreateEmbedding,
      },
    };
  });
});

// Mock do logger para evitar saídas no console durante os testes
jest.mock('../lib/logger', () => ({
  error: jest.fn(),
}));

describe('OpenAI Service', () => {
  const sampleContent = [
    { author: 'Alice', content: 'Devemos refatorar o módulo de autenticação?' },
    { author: 'Bob', content: 'Sim, vou criar um ticket para isso.' },
  ];

  beforeEach(() => {
    // Define a chave da API para os testes
    process.env.OPENAI_API_KEY = 'test-key';
    // Limpa os mocks antes de cada teste
    mockCreateChatCompletion.mockClear();
    mockCreateEmbedding.mockClear();
    (logger.error as jest.Mock).mockClear();
  });

  describe('generateSummary', () => {
    it('should generate a summary successfully', async () => {
      const mockSummary = 'A equipe discutiu a refatoração do módulo de autenticação. Bob criará um ticket.';
      mockCreateChatCompletion.mockResolvedValue({
        choices: [{ message: { content: mockSummary } }],
      });

      const summary = await generateSummary(sampleContent);

      expect(summary).toBe(mockSummary);
      expect(mockCreateChatCompletion).toHaveBeenCalledTimes(1);
      expect(mockCreateChatCompletion).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-3.5-turbo',
          messages: expect.any(Array),
        }),
      );
    });

    it('should return a default message when summary generation returns null content', async () => {
      mockCreateChatCompletion.mockResolvedValue({
        choices: [{ message: { content: null } }],
      });

      const summary = await generateSummary(sampleContent);
      expect(summary).toBe('Não foi possível gerar resumo.');
    });

    it('should throw an error and log it when the API call fails', async () => {
      const apiError = new Error('API Error');
      mockCreateChatCompletion.mockRejectedValue(apiError);

      await expect(generateSummary(sampleContent)).rejects.toThrow('Falha ao gerar resumo');
      expect(logger.error).toHaveBeenCalledWith('Error generating summary', { err: apiError });
    });
  });

  describe('extractActionItems', () => {
    it('should extract action items successfully', async () => {
      const mockActionItems = '- Criar um ticket para a refatoração do módulo de autenticação.';
      mockCreateChatCompletion.mockResolvedValue({
        choices: [{ message: { content: mockActionItems } }],
      });

      const actionItems = await extractActionItems(sampleContent);

      expect(actionItems).toEqual(['- Criar um ticket para a refatoração do módulo de autenticação.']);
      expect(mockCreateChatCompletion).toHaveBeenCalledTimes(1);
    });

    it('should return an empty array when no action items are found', async () => {
      mockCreateChatCompletion.mockResolvedValue({
        choices: [{ message: { content: 'Nenhuma ação específica identificada.' } }],
      });

      const actionItems = await extractActionItems(sampleContent);
      expect(actionItems).toEqual([]);
    });

    it('should throw an error and log it when the API call fails', async () => {
      const apiError = new Error('API Error');
      mockCreateChatCompletion.mockRejectedValue(apiError);

      await expect(extractActionItems(sampleContent)).rejects.toThrow('Falha ao extrair itens de ação');
      expect(logger.error).toHaveBeenCalledWith('Error extracting action items', { err: apiError });
    });
  });

  describe('detectTopics', () => {
    it('should detect topics successfully', async () => {
      const mockTopics = 'Refatoração\nAutenticação\nTickets';
      mockCreateChatCompletion.mockResolvedValue({
        choices: [{ message: { content: mockTopics } }],
      });

      const topics = await detectTopics(sampleContent);
      expect(topics).toEqual(['Refatoração', 'Autenticação', 'Tickets']);
    });

    it('should throw an error and log it when the API call fails', async () => {
      const apiError = new Error('API Error');
      mockCreateChatCompletion.mockRejectedValue(apiError);

      await expect(detectTopics(sampleContent)).rejects.toThrow('Falha ao detectar tópicos');
      expect(logger.error).toHaveBeenCalledWith('Error detecting topics', { err: apiError });
    });
  });

  describe('improveSearchQuery', () => {
    it('should return the original query plus variations', async () => {
      const originalQuery = 'refatorar auth';
      const mockVariations = 'refatorar autenticação\nmelhorar login';
      mockCreateChatCompletion.mockResolvedValue({
        choices: [{ message: { content: mockVariations } }],
      });

      const queries = await improveSearchQuery(originalQuery);
      expect(queries).toEqual(['refatorar auth', 'refatorar autenticação', 'melhorar login']);
    });

    it('should throw an error and log it when the API call fails', async () => {
      const apiError = new Error('API Error');
      mockCreateChatCompletion.mockRejectedValue(apiError);

      await expect(improveSearchQuery('test')).rejects.toThrow('Falha ao melhorar a consulta de busca');
      expect(logger.error).toHaveBeenCalledWith('Error improving search query', { err: apiError, query: 'test' });
    });
  });

  describe('generateEmbedding', () => {
    it('should generate an embedding successfully', async () => {
      const mockEmbedding = [0.1, 0.2, 0.3];
      mockCreateEmbedding.mockResolvedValue({
        data: [{ embedding: mockEmbedding }],
      });

      const embedding = await generateEmbedding('algum texto');
      expect(embedding).toEqual(mockEmbedding);
      expect(mockCreateEmbedding).toHaveBeenCalledWith({
        model: 'text-embedding-3-small',
        input: 'algum texto',
      });
    });

    it('should throw an error and log it when the API call fails', async () => {
      const apiError = new Error('API Error');
      mockCreateEmbedding.mockRejectedValue(apiError);

      await expect(generateEmbedding('test')).rejects.toThrow('Falha ao gerar embedding de texto');
      expect(logger.error).toHaveBeenCalledWith('Error generating text embedding', { err: apiError });
    });
  });

  describe('getOpenAIClient initialization', () => {
    it('should throw an error if OPENAI_API_KEY is not set', () => {
      // Remove a chave da API para este teste
      delete process.env.OPENAI_API_KEY;
      // É necessário resetar os módulos para que o arquivo openai.ts seja reavaliado
      jest.resetModules();
      const { generateSummary: generateSummaryWithoutKey } = require('../lib/openai');

      // O erro é lançado quando a função é chamada, pois getOpenAIClient é chamada internamente
      expect(generateSummaryWithoutKey([])).rejects.toThrow('OpenAI API key not configured');
    });
  });
});