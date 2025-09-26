
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth-config';

export async function GET(
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

    // Mock export data
    const mockData = {
      exportId: id,
      type: 'knowledge',
      format: 'json',
      generatedAt: new Date().toISOString(),
      data: [
        {
          id: '1',
          title: 'Database Migration Best Practices',
          content: 'Comprehensive guide to database migrations...',
          source: 'SLACK',
          tags: ['database', 'migration', 'best-practices'],
          author: 'Sarah Chen',
          createdAt: '2024-01-15T10:30:00Z'
        }
        // More data would be here in real export
      ],
      metadata: {
        totalItems: 142,
        exportedItems: 142,
        filters: {},
        exportedBy: session.user.name
      }
    };

    const jsonData = JSON.stringify(mockData, null, 2);
    
    return new NextResponse(jsonData, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="arkivame-export-${id}.json"`
      }
    });
  } catch (error) {
    console.error('Export download error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
