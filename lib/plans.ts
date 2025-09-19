export type PlanName = 'FREE' | 'STARTER' | 'BUSINESS';

interface PlanDetails {
  name: PlanName;
  archiveLimit: number; // Use Infinity for unlimited
}

const plans: Record<PlanName, PlanDetails> = {
  FREE: {
    name: 'FREE',
    archiveLimit: 50,
  },
  STARTER: {
    name: 'STARTER',
    archiveLimit: 200,
  },
  BUSINESS: {
    name: 'BUSINESS',
    archiveLimit: Infinity,
  },
};

/**
 * Retrieves the details for a given plan name.
 * @param planName The name of the plan.
 * @returns The plan details or null if not found.
 */
export function getPlanDetails(planName: string | null): PlanDetails | null {
  if (!planName || !Object.keys(plans).includes(planName)) {
    return null;
  }
  return plans[planName as PlanName];
}