
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '../lib/auth-config';
import { ArkivameLandingPage } from '@/components/landing/arkivame-landing-page';
import LoadingSpinner from '@/components/ui/loading-spinner';

// Static imports to avoid navigation issues
async function HomePage() {
  try {
    const session = await getServerSession(authOptions);
    const headersList = headers();
    const tenantType = headersList.get('x-tenant-type');
    
    // Simple routing logic without complex redirects
    switch (tenantType) {
      case 'super-admin':
        if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
          redirect('/login');
        }
        return (
          <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="text-center space-y-4">
              <h1 className="text-2xl font-bold">Super Admin Dashboard</h1>
              <p>Welcome, {session.user.name}!</p>
              <p className="text-sm text-muted-foreground">
                Super Admin features are being loaded...
              </p>
            </div>
          </div>
        );
        
      case 'organization':
        if (!session?.user) {
          redirect('/login');
        }
        return (
          <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="text-center space-y-4">
              <h1 className="text-2xl font-bold">Organization Dashboard</h1>
              <p>Welcome, {session.user.name}!</p>
              <p className="text-sm text-muted-foreground">
                Organization features are being loaded...
              </p>
            </div>
          </div>
        );
        
      default:
        // Landing page - stable implementation
        return <ArkivameLandingPage />;
    }
  } catch (error) {
    console.error('HomePage error:', error);
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-primary">Arkivame</h1>
          <p>Loading...</p>
        </div>
      </div>
    );
  }
}

export default HomePage;
