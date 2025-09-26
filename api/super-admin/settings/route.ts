
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth-config';
import { z } from 'zod';

const systemSettingsSchema = z.object({
  maintenanceMode: z.boolean().default(false),
  backupSchedule: z.string().default('daily'),
  securityLevel: z.enum(['low', 'medium', 'high']).default('medium'),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Mock system settings for now
    const systemSettings = {
      maintenanceMode: false,
      backupSchedule: 'daily',
      securityLevel: 'medium',
    };

    return NextResponse.json({ systemSettings });
  } catch (error) {
    console.error('Error fetching system settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = systemSettingsSchema.parse(body);

    // In a real application, save to database
    console.log('Updating system settings:', validatedData);

    return NextResponse.json({ success: true, updatedSettings: validatedData });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    console.error('Error updating system settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
