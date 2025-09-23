import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { z } from 'zod';

const ProactiveSettingsSchema = z.object({
  enabled: z.boolean().default(false),
  cooldownMinutes: z.coerce.number().min(1, "Cooldown must be at least 1 minute").default(15),
  threshold: z.coerce.number().min(0, "Threshold must be at least 0").max(1, "Threshold must be at most 1").default(0.7),
  enabledChannels: z.array(z.string()).default([]),
  responseTemplate: z.string().optional().default(''),
});

export async function GET(request: NextRequest, { params }: { params: { organizationId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organization = await prisma.organization.findUnique({
      where: { id: params.organizationId },
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const proactiveBotSettings = (organization.settings as any)?.proactiveBot || {
      enabled: false,
      cooldownMinutes: 15,
      threshold: 0.7,
      enabledChannels: [],
      responseTemplate: 'default',
    };

    return NextResponse.json({ proactiveBotSettings });
  } catch (error) {
    console.error('Error fetching proactive bot settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { organizationId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = ProactiveSettingsSchema.parse(body);

    const organization = await prisma.organization.findUnique({
        where: { id: params.organizationId },
    });

    if (!organization) {
        return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const updatedSettings = { ...organization.settings as any, proactiveBot: validatedData };

    await prisma.organization.update({
      where: { id: params.organizationId },
      data: {
        settings: updatedSettings,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    console.error('Error updating proactive bot settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}