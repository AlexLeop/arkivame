
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

// Sample audit logs
const sampleAuditLogs = [
  {
    id: '1',
    timestamp: new Date(Date.now() - 120000).toISOString(), // 2 minutes ago
    user: 'System',
    action: 'Database backup completed',
    details: 'Automated daily backup of all organization data completed successfully',
    type: 'success' as const,
    resource: 'database',
    ipAddress: null
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    user: 'admin@arkivame.com',
    action: 'Created new organization: TechCorp',
    details: 'New organization "TechCorp" created with BUSINESS plan',
    type: 'info' as const,
    resource: 'organization',
    ipAddress: '192.168.1.100'
  },
  {
    id: '3',
    timestamp: new Date(Date.now() - 10800000).toISOString(), // 3 hours ago
    user: 'System',
    action: 'Security scan completed',
    details: 'Automated security vulnerability scan completed. No critical issues found.',
    type: 'success' as const,
    resource: 'security',
    ipAddress: null
  },
  {
    id: '4',
    timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    user: 'admin@arkivame.com',
    action: 'Updated system configuration',
    details: 'Modified authentication timeout settings from 24h to 8h',
    type: 'warning' as const,
    resource: 'configuration',
    ipAddress: '192.168.1.100'
  },
  {
    id: '5',
    timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
    user: 'support@arkivame.com',
    action: 'Organization suspended: GlobalSys',
    details: 'Organization "GlobalSys" suspended due to payment failure',
    type: 'warning' as const,
    resource: 'organization',
    ipAddress: '192.168.1.105'
  },
  {
    id: '6',
    timestamp: new Date(Date.now() - 86400000 * 3).toISOString(), // 3 days ago
    user: 'System',
    action: 'Performance optimization completed',
    details: 'Database index optimization completed, query performance improved by 25%',
    type: 'success' as const,
    resource: 'performance',
    ipAddress: null
  }
];

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // In a real app, you would query the database with pagination
    const logs = sampleAuditLogs.slice(offset, offset + limit);

    return NextResponse.json({
      logs,
      total: sampleAuditLogs.length,
      limit,
      offset
    });

  } catch (error) {
    console.error('Audit logs API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
