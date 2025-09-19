
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Login - Arkivame',
  description: 'Sign in to your Arkivame account to access your knowledge management dashboard.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
