import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/db';

const PLANS = {
  starter: {
    name: 'Starter',
    price: 29,
    interval: 'month' as const,
    features: [
      'Até 5 usuários',
      '1GB de armazenamento',
      '100 itens de conhecimento',
      'Integrações básicas',
      'Suporte por email'
    ]
  },
  professional: {
    name: 'Professional',
    price: 99,
    interval: 'month' as const,
    features: [
      'Até 25 usuários',
      '10GB de armazenamento',
      '1000 itens de conhecimento',
      'Todas as integrações',
      'Suporte prioritário',
      'Analytics avançado'
    ]
  },
  enterprise: {
    name: 'Enterprise',
    price: 299,
    interval: 'month' as const,
    features: [
      'Usuários ilimitados',
      '100GB de armazenamento',
      'Itens de conhecimento ilimitados',
      'Integrações personalizadas',
      'Suporte dedicado',
      'SLA garantido'
    ]
  }
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user and organization
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { 
        organizations: {
          include: {
            subscription: true,
            _count: {
              select: {
                users: true,
                knowledgeItems: true
              }
            }
          }
        }
      }
    });

    if (!user || user.organizations.length === 0) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const organization = user.organizations[0];
    const subscription = organization.subscription;

    // Calculate storage usage (simplified)
    const storageUsage = await prisma.knowledgeItem.aggregate({
      where: { organizationId: organization.id },
      _sum: { content: true }
    });

    const storageGB = (storageUsage._sum.content || 0) / (1024 * 1024 * 1024);

    // Determine current plan based on subscription or default to starter
    let currentPlan = PLANS.starter;
    let planLimits = { users: 5, storage: 1, knowledgeItems: 100 };

    if (subscription) {
      switch (subscription.plan) {
        case 'PROFESSIONAL':
          currentPlan = PLANS.professional;
          planLimits = { users: 25, storage: 10, knowledgeItems: 1000 };
          break;
        case 'ENTERPRISE':
          currentPlan = PLANS.enterprise;
          planLimits = { users: 999999, storage: 100, knowledgeItems: 999999 };
          break;
        default:
          currentPlan = PLANS.starter;
          planLimits = { users: 5, storage: 1, knowledgeItems: 100 };
      }
    }

    const subscriptionData = {
      plan: currentPlan,
      status: subscription?.status || 'active',
      currentPeriodEnd: subscription?.currentPeriodEnd?.toISOString() || 
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd || false,
      usage: {
        users: { 
          current: organization._count.users, 
          limit: planLimits.users 
        },
        storage: { 
          current: parseFloat(storageGB.toFixed(1)), 
          limit: planLimits.storage 
        },
        knowledgeItems: { 
          current: organization._count.knowledgeItems, 
          limit: planLimits.knowledgeItems 
        }
      }
    };

    return NextResponse.json(subscriptionData);
  } catch (error) {
    console.error('Error fetching subscription data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, plan } = await request.json();

    // Get user and organization
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { organizations: true }
    });

    if (!user || user.organizations.length === 0) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const organizationId = user.organizations[0].id;

    switch (action) {
      case 'change_plan':
        // In a real implementation, this would integrate with Stripe
        await prisma.subscription.upsert({
          where: { organizationId },
          update: {
            plan: plan.toUpperCase(),
            status: 'active',
            updatedAt: new Date()
          },
          create: {
            organizationId,
            plan: plan.toUpperCase(),
            status: 'active',
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            cancelAtPeriodEnd: false
          }
        });
        break;

      case 'cancel':
        await prisma.subscription.update({
          where: { organizationId },
          data: {
            cancelAtPeriodEnd: true,
            updatedAt: new Date()
          }
        });
        break;

      case 'reactivate':
        await prisma.subscription.update({
          where: { organizationId },
          data: {
            cancelAtPeriodEnd: false,
            status: 'active',
            updatedAt: new Date()
          }
        });
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating subscription:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

