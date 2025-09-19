import { ReactNode } from 'react';
import Link from 'next/link';
import { ArkivameLogo } from '@/components/ui/arkivame-logo';
import { Button } from '@/components/ui/button';
import { CheckoutHandler } from './checkout-handler';
import { Settings, LayoutDashboard, Bot, LifeBuoy, LogOut } from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
  params: {
    organizationId: string;
  };
}

export default function DashboardLayout({ children, params }: DashboardLayoutProps) {
  // No futuro, você pode usar o `pathname` para ativar o botão correto.
  const { organizationId } = params;

  return (
    <div className="min-h-screen w-full flex bg-background">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r bg-muted/10 p-4 flex flex-col justify-between">
        <div>
          <div className="p-2 mb-8">
            <ArkivameLogo />
          </div>
          <nav className="flex flex-col space-y-1">
            <Button variant="ghost" className="w-full justify-start" asChild>
              <Link href={`/dashboard/${organizationId}`}><LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard</Link>
            </Button>
            <Button variant="ghost" className="w-full justify-start" asChild>
              <Link href={`/dashboard/${organizationId}/integrations`}><Bot className="mr-2 h-4 w-4" /> Integrations</Link>
            </Button>
            <Button variant="secondary" className="w-full justify-start" asChild>
              <Link href={`/dashboard/${organizationId}/settings`}><Settings className="mr-2 h-4 w-4" /> Settings</Link>
            </Button>
          </nav>
        </div>
        <nav className="flex flex-col space-y-1">
            {/* Links de rodapé da barra lateral */}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-8 overflow-auto">
        <CheckoutHandler organizationId={organizationId}>
          {children}
        </CheckoutHandler>
      </main>
    </div>
  );
}