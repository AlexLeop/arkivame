
import OpenAI from 'openai';
import logger from '@/lib/logger';
import { ChatMessage } from './types';

let openai: OpenAI | null = null;

if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

function getOpenAIClient(): OpenAI {
  if (!openai) {
    throw new Error('OpenAI API key not configured');
  }
  return openai;
}

function stringifyContent(content: ChatMessage[]): string {
  return content.map((message) => 
    `${message.author}: ${message.content}`
  ).join('\n');
}

export async function generateSummary(content: ChatMessage[]): Promise<string> {
  const client = getOpenAIClient();

  try {
    const text = stringifyContent(content);
    const response = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `Você é um assistente especializado em resumir conversas de equipe. 
                   Crie um resumo conciso e útil da conversa, destacando:
                   - Principais pontos discutidos
                   - Decisões tomadas
                   - Ações definidas
                   - Próximos passos
                   
                   O resumo deve ser claro, objetivo e em português brasileiro.`
        },
        {
          role: 'user',
          content: `Resuma a seguinte conversa:\n\n${text}`
        }
      ],
      max_tokens: 500,
      temperature: 0.3,
    });

    return response.choices[0]?.message?.content || 'Não foi possível gerar resumo.';
  } catch (error) {
    logger.error(error, 'Error generating summary');
    throw new Error('Falha ao gerar resumo via OpenAI', { cause: error }); // Re-throw to let the caller handle it
  }
}

export async function extractActionItems(content: ChatMessage[]): Promise<string[]> {
  const client = getOpenAIClient();

  try {
    const text = stringifyContent(content);
    const response = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `Analise a conversa e extraia todos os itens de ação (action items) mencionados.
                   Retorne apenas uma lista de ações específicas que foram definidas ou sugeridas.
                   Uma ação por linha, começada com "- ".
                   Se não houver ações claras, retorne "Nenhuma ação específica identificada."`
        },
        {
          role: 'user',
          content: text
        }
      ],
      max_tokens: 300,
      temperature: 0.2,
    });

    const result = response.choices[0]?.message?.content || '';
    return result.split('\n').filter(line => line.trim().startsWith('-')).map(line => line.trim());
  } catch (error) {
    logger.error(error, 'Error extracting action items');
    throw new Error('Falha ao extrair itens de ação via OpenAI', { cause: error });
  }
}

export async function detectTopics(content: ChatMessage[]): Promise<string[]> {
  const client = getOpenAIClient();

  try {
    const text = stringifyContent(content);
    const response = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `Analise a conversa e identifique os principais tópicos/assuntos discutidos.
                   Retorne até 5 tópicos, um por linha.
                   Use palavras-chave simples e relevantes em português.`
        },
        {
          role: 'user',
          content: text
        }
      ],
      max_tokens: 100,
      temperature: 0.3,
    });

    const result = response.choices[0]?.message?.content || '';
    return result.split('\n').filter(line => line.trim()).map(line => line.trim());
  } catch (error) {
    logger.error(error, 'Error detecting topics');
    throw new Error('Falha ao detectar tópicos via OpenAI', { cause: error });
  }
}

export async function improveSearchQuery(query: string): Promise<string[]> {
  const client = getOpenAIClient();

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `Você é um assistente de busca. Dada uma consulta, gere variações e sinônimos 
                   que poderiam ajudar a encontrar conteúdo relacionado.
                   Retorne até 5 variações da consulta, uma por linha.
                   Mantenha o idioma português e o contexto empresarial.`
        },
        {
          role: 'user',
          content: `Consulta original: "${query}"`
        }
      ],
      max_tokens: 200,
      temperature: 0.5,
    });

    const result = response.choices[0]?.message?.content || '';
    const variations = result.split('\n').filter(line => line.trim()).map(line => line.trim());
    
    return [query, ...variations];
  } catch (error) {
    logger.error(error, 'Error improving search query', { query });
    throw new Error('Falha ao melhorar a consulta de busca via OpenAI', { cause: error });
  }
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const client = getOpenAIClient();

  // Normaliza e limpa o texto para melhorar a qualidade do embedding
  const input = text.replace(/\n/g, ' ').trim();

  try {
    const response = await client.embeddings.create({
      model: 'text-embedding-3-small', // Modelo de embedding custo-efetivo e performático
      input: input,
    });

    return response.data[0].embedding;
  } catch (error) {
    logger.error(error, 'Error generating text embedding');
    throw new Error('Falha ao gerar embedding de texto via OpenAI', { cause: error });
  }
}
