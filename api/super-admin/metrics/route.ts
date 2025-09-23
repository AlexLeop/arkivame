
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Mock SaaS Metrics for now
    const saasMetrics = {
      revenue: {
        mrr: 8000,
        arr: 96000,
        arpa: 150,
        clv: 2800,
        ruleOf40: 0.45,
      },
      acquisition: {
        cac: 150,
        lvr: 25,
        activationRate: 0.75,
      },
      retention: {
        customerChurnRate: 0.05,
        netDollarRetention: 1.15,
        grossDollarRetention: 0.95,
      },
      engagement: {
        dauMauRatio: 0.30,
        stickinessRate: 0.60,
        featureAdoptionRate: 0.80,
      },
      satisfaction: {
        nps: 65,
        csat: 4.2,
        ces: 1.8,
      },
    };

    return NextResponse.json(saasMetrics);
  } catch (error) {
    console.error('Error fetching SaaS metrics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
