
import { NextResponse } from 'next/server';
import { PLANS } from '@/lib/stripe';

export async function GET() {
  try {
    // Filter out internal details like stripePriceId and limits for public API
    const publicPlans = Object.entries(PLANS).reduce((acc, [key, plan]) => {
      if (key === 'FREE') return acc; // Free plan is not offered for upgrade/downgrade via this API
      acc[key] = {
        name: plan.name,
        price: {
          monthly: plan.price,
          yearly: plan.price * 10, // Assuming a yearly discount
        },
        limits: plan.limits,
        features: plan.features,
      };
      return acc;
    }, {} as Record<string, any>);

    return NextResponse.json(publicPlans);
  } catch (error) {
    console.error('Error fetching plans:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
