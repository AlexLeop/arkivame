import { Resend } from 'resend';
import { LimitWarningEmail } from '@/emails/limit-warning-email';
import logger from './logger';

const resend = new Resend(process.env.RESEND_API_KEY);
const fromEmail = process.env.FROM_EMAIL || 'noreply@arkivame.app';

/**
 * Sends a usage limit warning email to a user.
 */
export async function sendUsageLimitWarningEmail({
  to,
  organizationName,
  planName,
  usagePercentage,
  upgradeLink,
}: {
  to: string;
  organizationName: string;
  planName: string;
  usagePercentage: number;
  upgradeLink: string;
}) {
  try {
    await resend.emails.send({
      from: fromEmail,
      to,
      subject: `Aviso: Limite de uso próximo para ${organizationName}`,
      react: LimitWarningEmail({
        organizationName,
        planName,
        usagePercentage,
        upgradeLink,
      }),
    });
  } catch (error) {
    logger.error({ err: error, to, organizationName }, 'Failed to send usage limit warning email');
    // Não relançar o erro para não parar o cron job
  }
}