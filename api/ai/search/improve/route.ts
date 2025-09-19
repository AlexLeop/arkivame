import { NextResponse } from 'next/server';
import { improveSearchQuery } from '@/lib/openai';
import logger from '@/lib/logger';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const query: string = body.query;

    if (typeof query !== 'string' || query.trim() === '') {
      return NextResponse.json({ message: 'O campo "query" é obrigatório e deve ser uma string não vazia.' }, { status: 400 });
    }

    const queries = await improveSearchQuery(query);

    return NextResponse.json({ queries });
  } catch (error) {
    if (error instanceof SyntaxError) {
        return NextResponse.json({ message: 'JSON inválido no corpo da requisição.' }, { status: 400 });
    }
    logger.error({ err: error }, 'API Error in /api/ai/search/improve');
    const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro inesperado.';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}