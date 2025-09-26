
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth-config';
import { z } from 'zod';

const createCommentSchema = z.object({
  content: z.string().min(1, "Comment content is required"),
  parentId: z.string().optional()
});

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

    // Mock comments for knowledge item
    const comments = [
      {
        id: '1',
        knowledgeId: id,
        content: 'This is really helpful! Thanks for sharing.',
        author: {
          id: '2',
          name: 'Mike Johnson',
          email: 'mike@acme.com',
          avatar: null
        },
        parentId: null,
        replies: [
          {
            id: '2',
            knowledgeId: id,
            content: 'Glad you found it useful!',
            author: {
              id: '1',
              name: 'Sarah Chen',
              email: 'sarah@acme.com',
              avatar: null
            },
            parentId: '1',
            replies: [],
            createdAt: '2024-01-15T10:45:00Z',
            updatedAt: '2024-01-15T10:45:00Z'
          }
        ],
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T10:30:00Z'
      },
      {
        id: '3',
        knowledgeId: id,
        content: 'Could you add more details about the rollback strategy?',
        author: {
          id: '3',
          name: 'David Kim',
          email: 'david@acme.com',
          avatar: null
        },
        parentId: null,
        replies: [],
        createdAt: '2024-01-15T09:15:00Z',
        updatedAt: '2024-01-15T09:15:00Z'
      }
    ];

    return NextResponse.json({
      data: comments,
      total: comments.length + comments.reduce((acc, c) => acc + c.replies.length, 0)
    });
  } catch (error) {
    console.error('Comments fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
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
    const validatedData = createCommentSchema.parse(body);

    // Mock comment creation
    const comment = {
      id: Math.random().toString(36).substr(2, 9),
      knowledgeId: id,
      content: validatedData.content,
      author: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        avatar: null
      },
      parentId: validatedData.parentId || null,
      replies: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error('Comment creation error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
