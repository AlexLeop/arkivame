
'use client';

import { SessionProvider } from 'next-auth/react';
import { AuthRedirect } from '@/components/auth/auth-redirect';
import { Toaster } from '@/components/ui/toaster';
import Providers from '@/components/providers';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchInterval={5 * 60} refetchOnWindowFocus={false}>
      <AuthRedirect />
      <Providers>
        {children}
      </Providers>
      <Toaster />
    </SessionProvider>
  );
}


