import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// Interfaces para as métricas SaaS
interface RevenueMetrics {
  mrr: number;
  mrrBreakdown: {
    new: number;
    expansion: number;
    contraction: number;
    churn: number;
  };
  arr: number;
  arpa: number;
  rpu: number;
  clv: number;
  asp: number;
  grossMargin: number;
  netCashFlow: number;
  burnRate: number;
  runway: number;
  ruleOf40: number;
  magicNumber: number;
}

interface AcquisitionMetrics {
  cac: number;
  cacPaybackPeriod: number;
  lvr: number;
  visitorToSignupRate: number;
  signupToCustomerRate: number;
  mqlToSqlRate: number;
  activationRate: number;
}

interface RetentionMetrics {
  customerChurnRate: number;
  grossMrrChurnRate: number;
  netMrrChurnRate: number;
  logoChurn: number;
  revenueChurn: number;
  expansionMrr: number;
  contractionMrr: number;
  netDollarRetention: number;
  grossDollarRetention: number;
}

interface EngagementMetrics {
  dauMauRatio: number;
  stickinessRate: number;
  featureAdoptionRate: number;
  avgSessionDuration: number;
  activeAccountsRate: number;
  customerHealthScore: number;
}

interface SalesMetrics {
  salesCycleLength: number;
  pipelineVelocity: number;
  winRate: number;
  quotaAttainment: number;
  blendedCac: number;
  marketingEfficiencyRatio: number;
}

interface SatisfactionMetrics {
  nps: number;
  ces: number;
  csat: number;
  supportResponseTime: number;
  supportResolutionTime: number;
  firstContactResolutionRate: number;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Super admin access required.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'all';
    const period = searchParams.get('period') || '30'; // dias

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - parseInt(period));

    // Buscar dados básicos do sistema
    const [
      totalOrganizations,
      activeOrganizations,
      totalUsers,
      activeUsers,
      totalSubscriptions,
      paidSubscriptions,
      totalKnowledge,
      recentSignups,
      recentChurns
    ] = await Promise.all([
      prisma.organization.count(),
      prisma.organization.count({
        where: {
          AND: [
            { status: 'ACTIVE' },
            { createdAt: { gte: startDate } }
          ]
        }
      }),
      prisma.user.count(),
      prisma.user.count({
        where: {
          lastLoginAt: { gte: startDate }
        }
      }),
      prisma.subscription.count(),
      prisma.subscription.count({
        where: {
          plan: { not: 'FREE' },
          status: 'ACTIVE'
        }
      }),
      prisma.knowledgeItem.count(),
      prisma.organization.count({
        where: {
          createdAt: { gte: startDate }
        }
      }),
      prisma.organization.count({
        where: {
          AND: [
            { status: 'CANCELLED' },
            { updatedAt: { gte: startDate } }
          ]
        }
      })
    ]);

    // Calcular métricas de receita
    const revenueMetrics: RevenueMetrics = await calculateRevenueMetrics(startDate, endDate);
    
    // Calcular métricas de aquisição
    const acquisitionMetrics: AcquisitionMetrics = await calculateAcquisitionMetrics(startDate, endDate);
    
    // Calcular métricas de retenção
    const retentionMetrics: RetentionMetrics = await calculateRetentionMetrics(startDate, endDate);
    
    // Calcular métricas de engajamento
    const engagementMetrics: EngagementMetrics = await calculateEngagementMetrics(startDate, endDate);
    
    // Calcular métricas de vendas
    const salesMetrics: SalesMetrics = await calculateSalesMetrics(startDate, endDate);
    
    // Calcular métricas de satisfação
    const satisfactionMetrics: SatisfactionMetrics = await calculateSatisfactionMetrics(startDate, endDate);

    const response = {
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        days: parseInt(period)
      },
      overview: {
        totalOrganizations,
        activeOrganizations,
        totalUsers,
        activeUsers,
        totalSubscriptions,
        paidSubscriptions,
        totalKnowledge,
        recentSignups,
        recentChurns
      },
      revenue: revenueMetrics,
      acquisition: acquisitionMetrics,
      retention: retentionMetrics,
      engagement: engagementMetrics,
      sales: salesMetrics,
      satisfaction: satisfactionMetrics
    };

    // Filtrar por categoria se especificada
    if (category !== 'all') {
      const categoryData = response[category as keyof typeof response];
      if (categoryData) {
        return NextResponse.json({
          period: response.period,
          [category]: categoryData
        });
      }
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching SaaS metrics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Funções auxiliares para calcular métricas específicas
async function calculateRevenueMetrics(startDate: Date, endDate: Date): Promise<RevenueMetrics> {
  // Preços dos planos (em centavos para evitar problemas de ponto flutuante)
  const planPrices = {
    FREE: 0,
    STARTER: 2900, // $29
    BUSINESS: 9900, // $99
    ENTERPRISE: 29900 // $299
  };

  const activeSubscriptions = await prisma.subscription.findMany({
    where: {
      status: 'ACTIVE',
      plan: { not: 'FREE' }
    },
    include: {
      organization: true
    }
  });

  // Calcular MRR
  const mrr = activeSubscriptions.reduce((total, sub) => {
    return total + (planPrices[sub.plan as keyof typeof planPrices] || 0);
  }, 0) / 100; // Converter de centavos para dólares

  // MRR Breakdown (simplificado - em produção seria mais complexo)
  const newSubscriptions = await prisma.subscription.count({
    where: {
      createdAt: { gte: startDate },
      status: 'ACTIVE',
      plan: { not: 'FREE' }
    }
  });

  const mrrBreakdown = {
    new: newSubscriptions * 29, // Estimativa baseada no plano starter
    expansion: mrr * 0.1, // 10% estimado
    contraction: mrr * 0.05, // 5% estimado
    churn: mrr * 0.08 // 8% estimado
  };

  const arr = mrr * 12;
  const arpa = activeSubscriptions.length > 0 ? mrr / activeSubscriptions.length : 0;
  const rpu = await calculateRPU();
  const clv = arpa * 24; // Estimativa: 24 meses de vida média
  const asp = arpa; // Simplified
  const grossMargin = 0.85; // 85% estimado para SaaS
  const netCashFlow = mrr * grossMargin;
  const burnRate = mrr * 0.3; // 30% estimado
  const runway = netCashFlow > 0 ? 12 : 6; // Simplificado
  const ruleOf40 = 0.25 + grossMargin; // 25% crescimento + margem
  const magicNumber = 1.2; // Estimado

  return {
    mrr,
    mrrBreakdown,
    arr,
    arpa,
    rpu,
    clv,
    asp,
    grossMargin,
    netCashFlow,
    burnRate,
    runway,
    ruleOf40,
    magicNumber
  };
}

async function calculateRPU(): Promise<number> {
  const totalUsers = await prisma.user.count();
  const totalRevenue = await prisma.subscription.findMany({
    where: { status: 'ACTIVE', plan: { not: 'FREE' } }
  });
  
  const monthlyRevenue = totalRevenue.reduce((total, sub) => {
    const planPrices = { STARTER: 29, BUSINESS: 99, ENTERPRISE: 299 };
    return total + (planPrices[sub.plan as keyof typeof planPrices] || 0);
  }, 0);

  return totalUsers > 0 ? monthlyRevenue / totalUsers : 0;
}

async function calculateAcquisitionMetrics(startDate: Date, endDate: Date): Promise<AcquisitionMetrics> {
  const newCustomers = await prisma.organization.count({
    where: {
      createdAt: { gte: startDate, lte: endDate }
    }
  });

  const totalMarketingSpend = 5000; // Estimativa - em produção viria de sistema de contabilidade
  const cac = newCustomers > 0 ? totalMarketingSpend / newCustomers : 0;
  const cacPaybackPeriod = 12; // 12 meses estimado
  const lvr = newCustomers * 1.2; // 20% crescimento estimado
  const visitorToSignupRate = 0.03; // 3% estimado
  const signupToCustomerRate = 0.15; // 15% estimado
  const mqlToSqlRate = 0.25; // 25% estimado
  const activationRate = 0.60; // 60% estimado

  return {
    cac,
    cacPaybackPeriod,
    lvr,
    visitorToSignupRate,
    signupToCustomerRate,
    mqlToSqlRate,
    activationRate
  };
}

async function calculateRetentionMetrics(startDate: Date, endDate: Date): Promise<RetentionMetrics> {
  const totalOrganizations = await prisma.organization.count({
    where: { createdAt: { lt: startDate } }
  });

  const churned = await prisma.organization.count({
    where: {
      status: 'CANCELLED',
      updatedAt: { gte: startDate, lte: endDate }
    }
  });

  const customerChurnRate = totalOrganizations > 0 ? (churned / totalOrganizations) * 100 : 0;
  const grossMrrChurnRate = customerChurnRate * 0.8; // Estimativa
  const netMrrChurnRate = grossMrrChurnRate - 2; // Considerando expansão
  const logoChurn = churned;
  const revenueChurn = churned * 29; // Estimativa baseada no plano médio
  const expansionMrr = 500; // Estimativa
  const contractionMrr = 200; // Estimativa
  const netDollarRetention = 110; // 110% estimado
  const grossDollarRetention = 95; // 95% estimado

  return {
    customerChurnRate,
    grossMrrChurnRate,
    netMrrChurnRate,
    logoChurn,
    revenueChurn,
    expansionMrr,
    contractionMrr,
    netDollarRetention,
    grossDollarRetention
  };
}

async function calculateEngagementMetrics(startDate: Date, endDate: Date): Promise<EngagementMetrics> {
  const dailyActiveUsers = await prisma.user.count({
    where: {
      lastLoginAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    }
  });

  const monthlyActiveUsers = await prisma.user.count({
    where: {
      lastLoginAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    }
  });

  const dauMauRatio = monthlyActiveUsers > 0 ? (dailyActiveUsers / monthlyActiveUsers) * 100 : 0;
  const stickinessRate = 0.25; // 25% estimado
  const featureAdoptionRate = 0.70; // 70% estimado
  const avgSessionDuration = 15; // 15 minutos estimado
  const activeAccountsRate = 0.80; // 80% estimado
  const customerHealthScore = 75; // Score de 0-100

  return {
    dauMauRatio,
    stickinessRate,
    featureAdoptionRate,
    avgSessionDuration,
    activeAccountsRate,
    customerHealthScore
  };
}

async function calculateSalesMetrics(startDate: Date, endDate: Date): Promise<SalesMetrics> {
  const salesCycleLength = 14; // 14 dias estimado
  const pipelineVelocity = 1.5; // Estimado
  const winRate = 0.20; // 20% estimado
  const quotaAttainment = 0.85; // 85% estimado
  const blendedCac = 150; // $150 estimado
  const marketingEfficiencyRatio = 2.5; // Estimado

  return {
    salesCycleLength,
    pipelineVelocity,
    winRate,
    quotaAttainment,
    blendedCac,
    marketingEfficiencyRatio
  };
}

async function calculateSatisfactionMetrics(startDate: Date, endDate: Date): Promise<SatisfactionMetrics> {
  // Em produção, estes dados viriam de sistemas de feedback e suporte
  const nps = 45; // Score NPS estimado
  const ces = 4.2; // Customer Effort Score (1-5)
  const csat = 4.5; // Customer Satisfaction (1-5)
  const supportResponseTime = 2.5; // 2.5 horas estimado
  const supportResolutionTime = 24; // 24 horas estimado
  const firstContactResolutionRate = 0.75; // 75% estimado

  return {
    nps,
    ces,
    csat,
    supportResponseTime,
    supportResolutionTime,
    firstContactResolutionRate
  };
}

