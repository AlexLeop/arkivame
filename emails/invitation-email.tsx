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

interface InvitationEmailProps {
  inviterName?: string | null;
  organizationName: string;
  inviteLink: string;
}

const baseUrl = process.env.NEXTAUTH_URL || '';

export const InvitationEmail = ({
  inviterName,
  organizationName,
  inviteLink,
}: InvitationEmailProps) => {
  const previewText = `Junte-se a ${organizationName} no Arkivame`;

  return (
    <Html lang="pt-BR">
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>
            Junte-se a <strong>{organizationName}</strong> no Arkivame
          </Heading>
          <Text style={paragraph}>
            {inviterName || 'Um membro da equipe'} convidou você para se juntar à organização {organizationName} no Arkivame.
          </Text>
          <Section style={btnContainer}>
            <Button style={button} href={inviteLink}>
              Aceitar Convite
            </Button>
          </Section>
          <Text style={paragraph}>
            Arkivame ajuda equipes a transformar conversas do Slack e Teams em uma base de conhecimento permanente e pesquisável.
          </Text>
          <Hr style={hr} />
          <Text style={footer}>
            Se você não esperava este convite, pode ignorar este e-mail. Se você acredita que isso é um erro, por favor, entre em contato com nosso <Link href={`${baseUrl}/contact`} style={link}>suporte</Link>.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default InvitationEmail;

// Styles
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

const heading = {
  fontSize: '28px',
  fontWeight: 'bold',
  marginTop: '48px',
  textAlign: 'center' as const,
  color: '#1a202c',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '24px',
  textAlign: 'left' as const,
  padding: '0 40px',
  color: '#4a5568',
};

const btnContainer = {
  textAlign: 'center' as const,
  padding: '20px 0',
};

const button = {
  backgroundColor: '#6366f1', // Cor primária do seu app
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
};

const hr = {
  borderColor: '#e2e8f0',
  margin: '20px 0',
};

const footer = {
  color: '#a0aec0',
  fontSize: '12px',
  lineHeight: '16px',
  padding: '0 40px',
};

const link = {
  color: '#6366f1',
  textDecoration: 'underline',
};