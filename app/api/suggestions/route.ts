import { NextResponse } from 'next/server';
import { findRelevantArchivedItems } from '@/lib/suggestions';
import logger from '@/lib/logger';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { content, organizationId } = body;

    // Validação dos dados de entrada
    if (!organizationId || typeof organizationId !== 'string') {
      return NextResponse.json(
        { error: 'organizationId is required and must be a string.' },
        { status: 400 }
      );
    }

    if (!content || typeof content !== 'string' || !content.trim()) {
      return NextResponse.json(
        { error: 'Content is required and must be a non-empty string.' },
        { status: 400 }
      );
    }

    const suggestions = await findRelevantArchivedItems(content, organizationId);

    return NextResponse.json(suggestions);
  } catch (error) {
    logger.error({ err: error }, 'Error in /api/suggestions');
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}