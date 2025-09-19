
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Super Admin - Arkivame',
  description: 'Arkivame Super Administrator Dashboard - Manage organizations and system settings.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
