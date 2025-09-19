
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { z } from 'zod';

const teamsConfigSchema = z.object({
  tenantId: z.string().min(1, "Tenant ID is required"),
  clientId: z.string().min(1, "Client ID is required"),
  clientSecret: z.string().min(1, "Client secret is required"),
  teams: z.array(z.string()).default([]),
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

    // Mock Teams integration status
    const teamsConfig = {
      connected: true,
      tenantId: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
      tenantName: 'Acme Corporation',
      clientId: 'yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy',
      clientSecret: '****',
      teams: [
        { id: 'team1', name: 'Engineering Team', connected: true, messageCount: 145 },
        { id: 'team2', name: 'Design Team', connected: false, messageCount: 0 },
        { id: 'team3', name: 'Support Team', connected: true, messageCount: 67 }
      ],
      syncEnabled: true,
      autoImport: false,
      lastSync: '2024-01-15T09:45:00Z',
      totalImported: 98,
      status: 'active'
    };

    return NextResponse.json(teamsConfig);
  } catch (error) {
    console.error('Teams config fetch error:', error);
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
    const validatedData = teamsConfigSchema.parse(body);

    // Mock Teams connection
    const teamsConnection = {
      id: Math.random().toString(36).substr(2, 9),
      tenantId: validatedData.tenantId,
      tenantName: 'Extracted from API',
      clientId: validatedData.clientId,
      clientSecret: validatedData.clientSecret,
      teams: validatedData.teams,
      syncEnabled: validatedData.syncEnabled,
      autoImport: validatedData.autoImport,
      connectedAt: new Date().toISOString(),
      connectedBy: session.user.name,
      status: 'active'
    };

    return NextResponse.json(teamsConnection, { status: 201 });
  } catch (error) {
    console.error('Teams connection error:', error);
    
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
