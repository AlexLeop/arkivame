import { NextResponse } from 'next/server';
import { generateEmbedding } from '@/lib/openai';
import logger from '@/lib/logger';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const text: string = body.text;

    if (typeof text !== 'string' || text.trim() === '') {
      return NextResponse.json({ message: 'O campo "text" é obrigatório e deve ser uma string não vazia.' }, { status: 400 });
    }

    const embedding = await generateEmbedding(text);

    return NextResponse.json({ embedding });
  } catch (error) {
    if (error instanceof SyntaxError) {
        return NextResponse.json({ message: 'JSON inválido no corpo da requisição.' }, { status: 400 });
    }
    logger.error({ err: error }, 'API Error in /api/ai/embedding');
    const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro inesperado.';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}