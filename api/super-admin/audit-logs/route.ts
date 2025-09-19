
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'all';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Mock audit logs
    let logs = [
      {
        id: '1',
        action: 'organization_created',
        actor: 'admin@arkivame.com',
        target: 'Acme Corporation',
        targetType: 'organization',
        metadata: { plan: 'BUSINESS' },
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0...',
        timestamp: '2024-01-15T10:30:00Z'
      },
      {
        id: '2', 
        action: 'user_login',
        actor: 'sarah@acme.com',
        target: 'sarah@acme.com',
        targetType: 'user',
        metadata: { success: true },
        ipAddress: '192.168.1.150',
        userAgent: 'Mozilla/5.0...',
        timestamp: '2024-01-15T09:45:00Z'
      },
      {
        id: '3',
        action: 'knowledge_created',
        actor: 'mike@techstart.com',
        target: 'API Security Guidelines',
        targetType: 'knowledge',
        metadata: { source: 'MANUAL' },
        ipAddress: '10.0.1.25',
        userAgent: 'Mozilla/5.0...',
        timestamp: '2024-01-15T08:20:00Z'
      },
      {
        id: '4',
        action: 'organization_deleted',
        actor: 'admin@arkivame.com',
        target: 'Old Test Org',
        targetType: 'organization',
        metadata: { reason: 'cleanup' },
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0...',
        timestamp: '2024-01-14T16:30:00Z'
      }
    ];

    // Apply filters
    if (action !== 'all') {
      logs = logs.filter(log => log.action === action);
    }

    // Pagination
    const paginatedLogs = logs.slice(offset, offset + limit);

    return NextResponse.json({
      data: paginatedLogs,
      total: logs.length,
      limit,
      offset
    });
  } catch (error) {
    console.error('Audit logs fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
