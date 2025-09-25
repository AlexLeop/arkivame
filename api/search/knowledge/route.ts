import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateEmbedding } from '@/lib/openai';
import logger from '@/lib/logger';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.organizations || session.user.organizations.length === 0) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const organizationId = session.user.organizations[0].id; // Assuming the first organization

  const { searchParams } = new URL(req.url);
  const query = searchParams.get('query');

  if (!query) {
    return new NextResponse('Search query is required', { status: 400 });
  }

  try {
    // 1. Generate embedding for the search query
    const queryEmbedding = await generateEmbedding(query);

    // 2. Perform vector similarity search using Prisma's unsupported raw query for vector extension
    // NOTE: This assumes your PostgreSQL database has the 'vector' extension enabled
    // and the 'embedding' column in KnowledgeItem is of type 'vector(1536)'
    const searchResults: any[] = await prisma.$queryRaw`
      SELECT
        id,
        title,
        summary,
        "createdAt",
        1 - (embedding <=> ${queryEmbedding}::vector) AS similarity
      FROM knowledge_items
      WHERE "organizationId" = ${organizationId}
      ORDER BY similarity DESC
      LIMIT 10;
    `;

    // Log the search query
    await prisma.searchQuery.create({
      data: {
        organizationId: organizationId,
        userId: session.user.id,
        query: query,
        resultsCount: searchResults.length,
      },
    });

    return NextResponse.json(searchResults);
  } catch (error) {
    logger.error({ error, query }, 'Error during knowledge search');
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
