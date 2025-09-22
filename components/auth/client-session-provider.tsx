
'use client';

import { SessionProvider } from 'next-auth/react';
import { AuthRedirect } from './auth-redirect';
import { Toaster } from '@/components/ui/toaster';

export default function ClientSessionProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchInterval={5 * 60} refetchOnWindowFocus={false}>
      <AuthRedirect />
      {children}
      <Toaster />
    </SessionProvider>
  );
}


