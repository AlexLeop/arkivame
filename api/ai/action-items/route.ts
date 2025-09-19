import { NextResponse } from 'next/server';
import { extractActionItems } from '@/lib/openai';
import logger from '@/lib/logger';
import { ChatMessage } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const content: ChatMessage[] = body.content;

    if (!Array.isArray(content) || content.length === 0) {
      return NextResponse.json({ message: 'O campo "content" é obrigatório e deve ser um array não vazio.' }, { status: 400 });
    }

    const actionItems = await extractActionItems(content);

    return NextResponse.json({ actionItems });
  } catch (error) {
    if (error instanceof SyntaxError) {
        return NextResponse.json({ message: 'JSON inválido no corpo da requisição.' }, { status: 400 });
    }
    logger.error({ err: error }, 'API Error in /api/ai/action-items');
    const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro inesperado.';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

