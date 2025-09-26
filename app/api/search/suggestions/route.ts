
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

// Sample search suggestions
const searchSuggestions = [
  'database migration',
  'project alpha planning',
  'security audit findings',
  'performance optimization',
  'customer feedback analysis',
  'design system updates',
  'authentication best practices',
  'UI component library',
  'API documentation',
  'deployment procedures',
  'code review process',
  'testing strategies',
  'monitoring setup',
  'backup procedures',
  'incident response'
];

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.toLowerCase() || '';
    const limit = parseInt(searchParams.get('limit') || '10');

    let suggestions = searchSuggestions;

    // Filter suggestions based on query
    if (query) {
      suggestions = searchSuggestions.filter(suggestion =>
        suggestion.toLowerCase().includes(query)
      );
    }

    // Limit results
    suggestions = suggestions.slice(0, limit);

    return NextResponse.json({
      suggestions,
      query
    });

  } catch (error) {
    console.error('Search suggestions API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
