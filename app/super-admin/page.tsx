
import { Suspense } from 'react';
import { protectPage } from '@/lib/session';
import { SuperAdminDashboard } from '@/components/dashboard/super-admin-dashboard';
import LoadingSpinner from '@/components/ui/loading-spinner';

export default async function SuperAdminPage() {
  await protectPage('SUPER_ADMIN');

  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={<LoadingSpinner size="lg" className="mx-auto mt-20" />}>
        <SuperAdminDashboard />
      </Suspense>
    </div>
  );
}
