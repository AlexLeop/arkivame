import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

type Role = 'USER' | 'ADMIN' | 'SUPER_ADMIN';

/**
 * A helper to protect Server Component pages.
 * Fetches the session and redirects to '/login' if the user is not authenticated
 * or does not have the required role.
 * @param requiredRole The role required to access the page.
 * @returns The session if the user is authorized.
 */
export async function protectPage(requiredRole: Role = 'USER'): Promise<NonNullable<Awaited<ReturnType<typeof getServerSession>>>> {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  if (requiredRole === 'SUPER_ADMIN' && session.user.role !== 'SUPER_ADMIN') {
    redirect('/login');
  }
  
  if (requiredRole === 'ADMIN' && session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
    redirect('/login');
  }

  return session;
}