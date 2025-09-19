
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';

    if (query.length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    // Mock search suggestions
    const allSuggestions = [
      'database migration best practices',
      'api security guidelines', 
      'react performance optimization',
      'docker container setup',
      'microservices architecture',
      'authentication patterns',
      'caching strategies',
      'monitoring and logging',
      'code review checklist',
      'deployment pipelines',
      'testing strategies',
      'error handling patterns'
    ];

    const suggestions = allSuggestions
      .filter(suggestion => 
        suggestion.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, 5);

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Search suggestions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
