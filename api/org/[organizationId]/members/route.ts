
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
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const offset = (page - 1) * limit;

    const members = await prisma.organizationUser.findMany({
      where: { organizationId: params.organizationId },
      include: {
        user: true,
      },
      take: limit,
      skip: offset,
    });

    const totalMembers = await prisma.organizationUser.count({
      where: { organizationId: params.organizationId },
    });

    return NextResponse.json({
      data: members,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalMembers / limit),
        totalItems: totalMembers,
      },
    });
  } catch (error) {
    console.error('Error fetching members:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
