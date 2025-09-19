import { NextResponse } from 'next/server';
import { getKnowledgeItems } from '@/lib/knowledge';
import logger from '@/lib/logger';

export async function GET(
  request: Request,
  { params }: { params: { orgId: string } }
) {
  const { orgId } = params;
  const { searchParams } = new URL(request.url);

  try {
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    if (isNaN(limit) || isNaN(offset) || limit < 1 || offset < 0) {
      return NextResponse.json({ message: 'Parâmetros de paginação inválidos.' }, { status: 400 });
    }

    const { items, totalCount } = await getKnowledgeItems({
      organizationId: orgId,
      limit,
      offset,
    });

    return NextResponse.json({
      data: items,
      pagination: {
        total: totalCount,
        limit,
        offset,
      },
    });
  } catch (error) {
    logger.error({ err: error, orgId }, 'API Error in /api/org/[orgId]/knowledge-items');
    const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro inesperado.';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}