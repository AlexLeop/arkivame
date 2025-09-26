
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../lib/auth-config';
import { z } from 'zod';

const settingsSchema = z.object({
  general: z.object({
    organizationName: z.string().min(1).optional(),
    description: z.string().optional(),
    timezone: z.string().optional(),
    language: z.string().optional(),
    logo: z.string().optional()
  }).optional(),
  
  security: z.object({
    passwordPolicy: z.object({
      minLength: z.number().min(6).max(50).optional(),
      requireUppercase: z.boolean().optional(),
      requireLowercase: z.boolean().optional(),
      requireNumbers: z.boolean().optional(),
      requireSymbols: z.boolean().optional()
    }).optional(),
    sessionTimeout: z.number().min(15).max(1440).optional(), // minutes
    twoFactorRequired: z.boolean().optional(),
    allowSignups: z.boolean().optional()
  }).optional(),
  
  integrations: z.object({
    slackEnabled: z.boolean().optional(),
    teamsEnabled: z.boolean().optional(),
    webhooksEnabled: z.boolean().optional(),
    apiAccessEnabled: z.boolean().optional()
  }).optional(),
  
  notifications: z.object({
    emailEnabled: z.boolean().optional(),
    pushEnabled: z.boolean().optional(),
    digestFrequency: z.enum(['daily', 'weekly', 'monthly', 'never']).optional(),
    notifyOnComment: z.boolean().optional(),
    notifyOnShare: z.boolean().optional(),
    notifyOnMention: z.boolean().optional()
  }).optional(),
  
  branding: z.object({
    primaryColor: z.string().optional(),
    secondaryColor: z.string().optional(),
    customCSS: z.string().optional(),
    customDomain: z.string().optional(),
    favicon: z.string().optional()
  }).optional()
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

    // Mock settings
    const settings = {
      general: {
        organizationName: 'Acme Corporation',
        description: 'Leading technology solutions provider',
        timezone: 'America/New_York',
        language: 'en',
        logo: '/logos/acme-logo.png'
      },
      
      security: {
        passwordPolicy: {
          minLength: 8,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSymbols: false
        },
        sessionTimeout: 480, // 8 hours
        twoFactorRequired: false,
        allowSignups: true
      },
      
      integrations: {
        slackEnabled: true,
        teamsEnabled: false,
        webhooksEnabled: true,
        apiAccessEnabled: true
      },
      
      notifications: {
        emailEnabled: true,
        pushEnabled: false,
        digestFrequency: 'weekly',
        notifyOnComment: true,
        notifyOnShare: true,
        notifyOnMention: true
      },
      
      branding: {
        primaryColor: '#3B82F6',
        secondaryColor: '#1E40AF',
        customCSS: '',
        customDomain: 'knowledge.acme.com',
        favicon: '/favicons/acme-favicon.ico'
      },
      
      metadata: {
        lastUpdated: '2024-01-15T10:30:00Z',
        updatedBy: 'admin@acme.com'
      }
    };

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Settings fetch error:', error);
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
    const validatedData = settingsSchema.parse(body);

    // Mock settings update
    const updatedSettings = {
      ...validatedData,
      metadata: {
        lastUpdated: new Date().toISOString(),
        updatedBy: session.user.email
      }
    };

    return NextResponse.json(updatedSettings);
  } catch (error) {
    console.error('Settings update error:', error);
    
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
