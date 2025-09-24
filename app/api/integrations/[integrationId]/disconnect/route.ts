import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/db';
import { IntegrationType } from '@prisma/client'; // Import IntegrationType

export async function POST(
  request: Request,
  { params }: { params: { integrationId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { integrationId } = params;
    const { organizationId } = await request.json();

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    // Convert to uppercase and validate against IntegrationType enum
    const integrationType = integrationId.toUpperCase() as IntegrationType;
    
    // Validate the integration type is valid
    if (!Object.values(IntegrationType).includes(integrationType)) {
      return NextResponse.json(
        { error: 'Invalid integration type' },
        { status: 400 }
      );
    }

    // Update the integration status
    await prisma.integration.updateMany({
      where: {
        organizationId,
        type: integrationType,
      },
      data: {
        isActive: false,
        credentials: {},
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Error disconnecting integration ${params.integrationId}:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


