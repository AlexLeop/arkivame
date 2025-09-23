import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Heading,
  Preview,
  Section,
  Text,
  Link,
} from '@react-email/components';
import * as React from 'react';

interface LimitWarningEmailProps {
  organizationName: string;
  planName: string;
  usagePercentage: number;
  upgradeLink: string;
}

const baseUrl = process.env.NEXTAUTH_URL || '';

export const LimitWarningEmail = ({
  organizationName,
  planName,
  usagePercentage,
  upgradeLink,
}: LimitWarningEmailProps) => {
  const previewText = `Aviso de limite de uso para ${organizationName}`;

  return (
    <Html lang="pt-BR">
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>
            Aviso de Limite de Uso - {organizationName}
          </Heading>
          <Text style={paragraph}>
            Olá! Este é um aviso para informar que sua organização,{' '}
            <strong>{organizationName}</strong>, já utilizou{' '}
            <strong>{usagePercentage}%</strong> do limite de arquivamentos do seu
            plano <strong>{planName}</strong>.
          </Text>
          <Text style={paragraph}>
            Para garantir que você possa continuar arquivando conhecimento sem
            interrupções, considere fazer um upgrade para um plano superior.
          </Text>
          <Section style={btnContainer}>
            <Button style={button} href={upgradeLink}>
              Ver Planos e Fazer Upgrade
            </Button>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>
            Se você acredita que isso é um erro, por favor, entre em contato com
            nosso{' '}
            <Link href={`${baseUrl}/contact`} style={link}>
              suporte
            </Link>
            .
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default LimitWarningEmail;

// Styles (reutilizados e adaptados de invitation-email)
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};
const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  border: '1px solid #f0f0f0',
  borderRadius: '4px',
};
const heading = { fontSize: '24px', fontWeight: 'bold', textAlign: 'center' as const, color: '#1a202c', padding: '0 40px' };
const paragraph = { fontSize: '16px', lineHeight: '24px', textAlign: 'left' as const, padding: '0 40px', color: '#4a5568' };
const btnContainer = { textAlign: 'center' as const, padding: '20px 0' };
const button = {
  backgroundColor: '#6366f1',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
};
const hr = { borderColor: '#e2e8f0', margin: '20px 0' };
const footer = { color: '#a0aec0', fontSize: '12px', lineHeight: '16px', padding: '0 40px' };
const link = { color: '#6366f1', textDecoration: 'underline' };