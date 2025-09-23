import { prisma } from './db';
import { sendUsageLimitWarningEmail } from './email';
import { PLANS } from './stripe';

export async function checkAndNotifyLimits(organizationId: string, usageType: 'members' | 'storage') {
  try {
    // Get organization with subscription and usage data
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        subscription: true,
        _count: {
          select: {
            members: true,
            knowledgeItems: true,
          },
        },
      },
    });

    if (!organization || !organization.subscription) {
      console.warn(`No subscription found for organization ${organizationId}`);
      return;
    }

    const { subscription, _count } = organization;
    const planEnum = subscription.plan;

    const planName = planEnum.toUpperCase() as keyof typeof PLANS;
    const planDetails = PLANS[planName];

    if (!planDetails) {
      console.warn(`Plan details not found for plan ${planName} in organization ${organizationId}`);
      return;
    }

    // Get current plan limits
    const planLimits = {
      members: planDetails.limits.users === -1 ? Infinity : planDetails.limits.users,
      storageMB: planDetails.limits.storage === -1 ? Infinity : planDetails.limits.storage * 1024, // Convert GB to MB
    };

    // Get current usage
    const currentUsage = {
      members: _count.members,
      // For demo purposes, using knowledge count as storage
      storage: _count.knowledgeItems * 0.1, // Assuming 0.1MB per knowledge item
    };

    // Check if we're close to the limit (80% or more)
    const threshold = 0.8;
    let isNearLimit = false;
    let usagePercentage = 0;
    switch (usageType) {
      case 'members':
        usagePercentage = currentUsage.members / planLimits.members;
        isNearLimit = usagePercentage >= threshold;
        break;
      case 'storage':
        usagePercentage = currentUsage.storage / planLimits.storageMB;
        isNearLimit = usagePercentage >= threshold;
        break;
    }

    if (isNearLimit) {
      // Get organization admins
      const admins = await prisma.organizationMember.findMany({
        where: {
          organizationId,
          role: 'ADMIN',
          user: { email: { not: null } },
        },
        include: { user: true },
      });

      // Send email notification to each admin
      for (const admin of admins) {
        if (admin.user.email) {
          await sendUsageLimitWarningEmail({
            to: admin.user.email,
            organizationName: organization.name,
            planName: planDetails.name,
            usagePercentage: Math.round(usagePercentage * 100),
            upgradeLink: `${process.env.NEXTAUTH_URL}/dashboard/${organizationId}/billing`,
          });
        }
      }
    }

    return {
      isNearLimit,
      usagePercentage,
      currentUsage: currentUsage[usageType],
      limit: planLimits[usageType === 'storage' ? 'storageMB' : 'members'],
    };
  } catch (error) {
    console.error('Error checking limits:', error);
    return null;
  }
}
