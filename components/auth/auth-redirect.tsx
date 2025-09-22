'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export function AuthRedirect() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      if (session.user.role === 'SUPER_ADMIN') {
        router.push('/super-admin');
      } else if (session.user.organizations && session.user.organizations.length > 0) {
        router.push(`/dashboard/${session.user.organizations[0].slug || session.user.organizations[0].id}`);
      } else {
        router.push('/dashboard');
      }
    }
  }, [status, session, router]);

  return null;
}

