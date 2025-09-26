
import { Suspense } from 'react';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '../lib/auth-config';
import LoadingSpinner from '@/components/ui/loading-spinner';

function SimpleLandingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-primary">Arkivame</h1>
        <p className="text-lg text-muted-foreground">Sistema funcionando!</p>
        <div className="space-x-4">
          <a href="/login" className="text-primary hover:underline">Login</a>
          <a href="/signup" className="text-primary hover:underline">Signup</a>
          <a href="/super-admin" className="text-primary hover:underline">Super Admin</a>
        </div>
      </div>
    </div>
  );
}

async function HomePage() {
  const session = await getServerSession(authOptions);
  const headersList = headers();
  const tenantType = headersList.get('x-tenant-type');
  
  console.log('Page render - tenantType:', tenantType);
  
  // If user is logged in but on landing page, redirect to appropriate dashboard
  if (session?.user && tenantType === 'landing') {
    if (session.user.role === 'SUPER_ADMIN') {
      redirect('/super-admin');
    } else if (session.user.organizations?.[0]) {
      const org = session.user.organizations[0];
      redirect(`https://${org.slug}.localhost:3000`);
    }
  }
  
  // Super admin dashboard
  if (tenantType === 'super-admin') {
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      redirect('/login');
    }
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Super Admin Dashboard</h1>
          <p>Welcome, {session.user.name}!</p>
        </div>
      </div>
    );
  }
  
  // Organization dashboard - validate tenant exists
  if (tenantType === 'organization') {
    if (!session?.user) {
      redirect('/login');
    }
    
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Organization Dashboard</h1>
          <p>Welcome, {session.user.name}!</p>
        </div>
      </div>
    );
  }
  
  // Landing page
  return (
    <Suspense fallback={<LoadingSpinner size="lg" className="mx-auto mt-20" />}>
      <SimpleLandingPage />
    </Suspense>
  );
}

export default HomePage;
