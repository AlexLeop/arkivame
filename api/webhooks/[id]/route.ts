
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;
    const body = await request.json();

    // Mock webhook update
    const updatedWebhook = {
      id,
      ...body,
      updatedAt: new Date().toISOString(),
      updatedBy: session.user.email
    };

    return NextResponse.json(updatedWebhook);
  } catch (error) {
    console.error('Webhook update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;

    // Mock webhook deletion
    return NextResponse.json({ 
      success: true, 
      id,
      deletedAt: new Date().toISOString(),
      deletedBy: session.user.email
    });
  } catch (error) {
    console.error('Webhook delete error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
