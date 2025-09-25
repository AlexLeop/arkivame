import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import logger from '@/lib/logger';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.organizations || session.user.organizations.length === 0) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const organizationId = session.user.organizations[0].id; // Assuming the first organization

  try {
    const knowledgeItems = await prisma.knowledgeItem.findMany({
      where: {
        organizationId: organizationId,
      },
      select: {
        id: true,
        title: true,
        summary: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(knowledgeItems);
  } catch (error) {
    logger.error({ error, organizationId }, 'Error fetching knowledge items');
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}