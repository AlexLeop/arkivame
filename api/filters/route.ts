
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../lib/auth-config';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Mock filter options
    const filters = {
      sources: [
        { value: 'SLACK', label: 'Slack', count: 67 },
        { value: 'TEAMS', label: 'Microsoft Teams', count: 45 },
        { value: 'MANUAL', label: 'Manual Entry', count: 30 }
      ],
      tags: [
        { value: 'engineering', label: 'Engineering', count: 34 },
        { value: 'design', label: 'Design', count: 28 },
        { value: 'security', label: 'Security', count: 25 },
        { value: 'planning', label: 'Planning', count: 22 },
        { value: 'best-practices', label: 'Best Practices', count: 30 }
      ],
      authors: [
        { value: 'sarah-chen', label: 'Sarah Chen', count: 15 },
        { value: 'mike-johnson', label: 'Mike Johnson', count: 12 },
        { value: 'david-kim', label: 'David Kim', count: 8 }
      ],
      dateRanges: [
        { value: 'today', label: 'Today' },
        { value: 'week', label: 'This Week' },
        { value: 'month', label: 'This Month' },
        { value: 'quarter', label: 'This Quarter' },
        { value: 'custom', label: 'Custom Range' }
      ]
    };

    return NextResponse.json(filters);
  } catch (error) {
    console.error('Filters fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
