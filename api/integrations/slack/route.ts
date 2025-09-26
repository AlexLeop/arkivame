
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth-config';
import { z } from 'zod';

const slackConfigSchema = z.object({
  workspaceUrl: z.string().url("Valid workspace URL is required"),
  botToken: z.string().min(1, "Bot token is required"),
  channels: z.array(z.string()).default([]),
  syncEnabled: z.boolean().default(true),
  autoImport: z.boolean().default(false)
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

    // Mock Slack integration status
    const slackConfig = {
      connected: true,
      workspaceUrl: 'https://acme-corp.slack.com',
      workspaceName: 'Acme Corp',
      botToken: 'xoxb-****-****-****',
      channels: [
        { id: 'C1234567890', name: '#engineering', connected: true, messageCount: 234 },
        { id: 'C2345678901', name: '#general', connected: false, messageCount: 0 },
        { id: 'C3456789012', name: '#support', connected: true, messageCount: 89 }
      ],
      syncEnabled: true,
      autoImport: false,
      lastSync: '2024-01-15T10:30:00Z',
      totalImported: 156,
      status: 'active'
    };

    return NextResponse.json(slackConfig);
  } catch (error) {
    console.error('Slack config fetch error:', error);
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
    const validatedData = slackConfigSchema.parse(body);

    // Mock Slack connection
    const slackConnection = {
      id: Math.random().toString(36).substr(2, 9),
      workspaceUrl: validatedData.workspaceUrl,
      workspaceName: 'Extracted from API',
      botToken: validatedData.botToken,
      channels: validatedData.channels,
      syncEnabled: validatedData.syncEnabled,
      autoImport: validatedData.autoImport,
      connectedAt: new Date().toISOString(),
      connectedBy: session.user.name,
      status: 'active'
    };

    return NextResponse.json(slackConnection, { status: 201 });
  } catch (error) {
    console.error('Slack connection error:', error);
    
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

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Mock Slack config update
    const updatedConfig = {
      ...body,
      updatedAt: new Date().toISOString(),
      updatedBy: session.user.name
    };

    return NextResponse.json(updatedConfig);
  } catch (error) {
    console.error('Slack update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Mock Slack disconnection
    return NextResponse.json({ 
      success: true,
      disconnectedAt: new Date().toISOString(),
      disconnectedBy: session.user.name
    });
  } catch (error) {
    console.error('Slack disconnect error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
