
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth-config';

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

    // Mock knowledge item - in real app this would come from database
    const knowledge = {
      id,
      title: 'Database Migration Best Practices',
      content: `# Database Migration Best Practices

When migrating databases, it's crucial to follow established patterns and practices to ensure data integrity and minimal downtime.

## Pre-Migration Checklist

1. **Backup Everything**: Always create full backups before starting
2. **Test in Staging**: Never migrate directly to production
3. **Plan Rollback Strategy**: Have a clear plan to undo changes if needed

## Migration Steps

### 1. Schema Changes
- Create new tables/columns first
- Migrate data in batches
- Remove old structures last

### 2. Data Migration
- Use batch processing for large datasets
- Validate data integrity at each step
- Monitor performance during migration

## Post-Migration

- Verify all data has been migrated correctly
- Update application configurations
- Monitor system performance
- Document the changes made`,
      source: 'SLACK',
      channel: '#engineering',
      tags: ['database', 'migration', 'best-practices'],
      author: 'Sarah Chen',
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-01-15T10:30:00Z',
      views: 156,
      bookmarked: true
    };

    return NextResponse.json(knowledge);
  } catch (error) {
    console.error('Knowledge fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    // In a real app, update the knowledge item in the database
    const updatedKnowledge = {
      id,
      ...body,
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json(updatedKnowledge);
  } catch (error) {
    console.error('Knowledge update error:', error);
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

    // In a real app, delete the knowledge item from the database
    
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Knowledge delete error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
