import cron from 'node-cron';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';
import { getPlanDetails } from '@/lib/plans';
import { sendUsageLimitWarningEmail } from '@/lib/email';
import { subDays } from 'date-fns';

const NOTIFICATION_THRESHOLD = 0.8; // 80%
const NOTIFICATION_COOLDOWN_DAYS = 7; // Don't notify more than once a week

async function checkUsageAndNotify() {
  logger.info('Starting usage check cron job...');

  const subscriptions = await prisma.subscription.findMany({
    where: {
      status: 'ACTIVE',
      plan: { notIn: ['FREE', 'BUSINESS'] }, // Only check plans with defined limits
    },
    select: {
      id: true,
      plan: true,
      usageNotificationSentAt: true,
      organization: {
        select: {
          id: true,
          name: true,
          users: {
            where: { role: 'OWNER' },
            take: 1,
            select: {
              user: {
                select: {
                  email: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (subscriptions.length === 0) {
    logger.info('No active subscriptions to check. Finished job.');
    return;
  }

  const organizationIds = subscriptions.map(s => s.organization.id);

  // Otimização: Buscar a contagem de uso para todas as organizações de uma só vez.
  const usageCounts = await prisma.knowledgeItem.groupBy({
    by: ['organizationId'],
    where: {
      organizationId: { in: organizationIds },
    },
    _count: {
      id: true,
    },
  });

  const usageMap = new Map(usageCounts.map(u => [u.organizationId, u._count.id]));

  for (const subscription of subscriptions) {
    const { id, organization, plan, usageNotificationSentAt } = subscription;

    const owner = organization?.users[0]?.user;
    if (!organization || !owner) continue;

    // Skip if a notification was sent recently
    if (usageNotificationSentAt && usageNotificationSentAt > subDays(new Date(), NOTIFICATION_COOLDOWN_DAYS)) {
      continue;
    }

    const planDetails = getPlanDetails(plan);
    if (!planDetails || planDetails.archiveLimit === Infinity) continue;

    // Otimização: Obter a contagem do mapa em vez de consultar o banco.
    const currentUsage = usageMap.get(organization.id) || 0;
    const usageRatio = currentUsage / planDetails.archiveLimit;

    if (usageRatio >= NOTIFICATION_THRESHOLD) {
      logger.info(
        { organizationId: organization.id, usage: currentUsage, limit: planDetails.archiveLimit },
        'Organization has reached usage threshold. Sending notification.',
      );

      await sendUsageLimitWarningEmail({
        to: owner.email,
        organizationName: organization.name,
        planName: planDetails.name,
        usagePercentage: Math.round(usageRatio * 100),
        upgradeLink: `${process.env.NEXTAUTH_URL}/dashboard/${organization.id}/settings/billing`,
      });

      // Mark that a notification has been sent
      await prisma.subscription.update({
        where: { id },
        data: { usageNotificationSentAt: new Date() },
      });
    }
  }

  logger.info('Finished usage check cron job.');
}

// Schedule the job to run once a day at 8:00 AM
cron.schedule('0 8 * * *', checkUsageAndNotify, {
  timezone: 'America/Sao_Paulo',
});

logger.info('Usage check cron job scheduled.');