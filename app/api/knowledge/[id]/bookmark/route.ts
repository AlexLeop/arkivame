import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const { bookmarked } = await request.json();

    // Get user and organization
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { organizations: true }
    });

    if (!user || user.organizations.length === 0) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const organizationId = user.organizations[0].id;

    // Update bookmark status
    await prisma.knowledgeItem.update({
      where: {
        id,
        organizationId
      },
      data: {
        bookmarked
      }
    });

    return NextResponse.json({ success: true, bookmarked });
  } catch (error) {
    console.error('Error updating bookmark:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

