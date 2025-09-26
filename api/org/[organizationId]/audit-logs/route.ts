
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth-config';

export async function GET(request: NextRequest, { params }: { params: { organizationId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const cursor = searchParams.get('cursor');
    const actorId = searchParams.get('actorId');
    const action = searchParams.get('action');
    const search = searchParams.get('search');

    const where: any = {
      organizationId: params.organizationId,
    };

    if (actorId) {
      where.userId = actorId;
    }
    if (action) {
      where.action = action;
    }
    if (search) {
      where.message = { contains: search, mode: 'insensitive' };
    }

    const logs = await prisma.auditLog.findMany({
      where,
      take: limit + 1, // Fetch one more to determine if there's a next page
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { timestamp: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    let nextCursor: string | null = null;
    if (logs.length > limit) {
      const lastLog = logs.pop(); // Remove the extra item
      nextCursor = lastLog!.id;
    }

    const formattedLogs = logs.map((log) => ({
      id: log.id,
      action: log.action,
      message: log.details ? (log.details as any).message || log.action : log.action,
      createdAt: log.timestamp.toISOString(),
      actor: log.user || { id: 'system', name: 'System', email: 'system@example.com', image: null },
    }));

    return NextResponse.json({ logs: formattedLogs, nextCursor });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
