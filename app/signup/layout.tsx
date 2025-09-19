
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Sign Up - Arkivame',
  description: 'Create your Arkivame account and start preserving your team knowledge today.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
