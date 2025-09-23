import { Resend } from 'resend';
import { LimitWarningEmail } from './limit-warning-email';
import { InvitationEmail } from './invitation-email';

const resend = new Resend(process.env.RESEND_API_KEY);

type SendEmailProps = {
  to: string;
  subject: string;
  react: React.ReactElement;
  from?: string;
};

export async function sendEmail({ to, subject, react, from = 'no-reply@yourdomain.com' }: SendEmailProps) {
  try {
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      react,
    });

    if (error) {
      console.error('Error sending email:', error);
      return { error };
    }

    return { data };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { error };
  }
}

export { LimitWarningEmail, InvitationEmail };
