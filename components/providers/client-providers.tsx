
'use client';

import { SessionProvider } from 'next-auth/react';
import { AuthRedirect } from '@/components/auth/auth-redirect';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/theme-provider';

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchInterval={5 * 60} refetchOnWindowFocus={false}>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
        disableTransitionOnChange
        storageKey="arkivame-theme"
      >
        <AuthRedirect />
        {children}
      </ThemeProvider>
      <Toaster />
    </SessionProvider>
  );
}


