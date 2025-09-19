
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { z } from 'zod';

const webhookSchema = z.object({
  name: z.string().min(1, "Webhook name is required"),
  url: z.string().url("Valid URL is required"),
  events: z.array(z.string()).min(1, "At least one event is required"),
  secret: z.string().min(8, "Secret must be at least 8 characters").optional(),
  active: z.boolean().default(true),
  headers: z.record(z.string()).optional()
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Mock webhooks
    const webhooks = [
      {
        id: '1',
        name: 'Slack Notifications',
        url: 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX',
        events: ['knowledge_created', 'knowledge_updated', 'user_joined'],
        secret: 'webhook_secret_123',
        active: true,
        headers: {
          'Content-Type': 'application/json'
        },
        createdAt: '2024-01-10T08:00:00Z',
        lastTriggered: '2024-01-15T10:30:00Z',
        totalDeliveries: 156,
        successfulDeliveries: 154,
        failedDeliveries: 2,
        createdBy: 'admin@acme.com'
      },
      {
        id: '2',
        name: 'External Analytics',
        url: 'https://analytics.external.com/webhook',
        events: ['knowledge_viewed', 'search_performed'],
        secret: 'analytics_secret_456',
        active: false,
        headers: {
          'Authorization': 'Bearer token_here'
        },
        createdAt: '2024-01-12T14:00:00Z',
        lastTriggered: '2024-01-14T16:45:00Z',
        totalDeliveries: 89,
        successfulDeliveries: 87,
        failedDeliveries: 2,
        createdBy: 'admin@acme.com'
      }
    ];

    return NextResponse.json({
      data: webhooks,
      total: webhooks.length,
      availableEvents: [
        'knowledge_created',
        'knowledge_updated',
        'knowledge_deleted',
        'knowledge_viewed',
        'knowledge_bookmarked',
        'user_joined',
        'user_removed',
        'comment_added',
        'search_performed'
      ]
    });
  } catch (error) {
    console.error('Webhooks fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = webhookSchema.parse(body);

    // Mock webhook creation
    const webhook = {
      id: Math.random().toString(36).substr(2, 9),
      name: validatedData.name,
      url: validatedData.url,
      events: validatedData.events,
      secret: validatedData.secret || Math.random().toString(36).substr(2, 16),
      active: validatedData.active,
      headers: validatedData.headers || {},
      createdAt: new Date().toISOString(),
      lastTriggered: null,
      totalDeliveries: 0,
      successfulDeliveries: 0,
      failedDeliveries: 0,
      createdBy: session.user.email
    };

    return NextResponse.json(webhook, { status: 201 });
  } catch (error) {
    console.error('Webhook creation error:', error);
    
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
