'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArkivameLogo } from '@/components/ui/arkivame-logo';
import { Button } from '@/components/ui/button';
import { CheckoutHandler } from './checkout-handler';
import { 
  Settings, 
  LayoutDashboard, 
  Bot, 
  LifeBuoy, 
  LogOut,
  Search,
  Bell,
  User,
  ChevronDown
} from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
  params: {
    organizationId: string;
  };
}

export default function DashboardLayout({ children, params }: DashboardLayoutProps) {
  const { organizationId } = params;
  const pathname = usePathname();

  return (
    <div className="min-h-screen w-full flex bg-muted/30">
      {/* Sidebar */}
      <aside className="arkivame-sidebar fixed left-0 top-0 z-40 h-screen">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-border">
            <ArkivameLogo />
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            <Link href={`/dashboard/${organizationId}`} className={pathname === `/dashboard/${organizationId}` ? "arkivame-sidebar-item-active" : "arkivame-sidebar-item"}>
              <LayoutDashboard className="h-5 w-5" />
              <span>Dashboard</span>
            </Link>
            
            <Link href={`/dashboard/${organizationId}/integrations`} className={pathname.startsWith(`/dashboard/${organizationId}/integrations`) ? "arkivame-sidebar-item-active" : "arkivame-sidebar-item"}>
              <Bot className="h-5 w-5" />
              <span>Integrações</span>
            </Link>
            
            <Link href={`/dashboard/${organizationId}/settings`} className={pathname.startsWith(`/dashboard/${organizationId}/settings`) ? "arkivame-sidebar-item-active" : "arkivame-sidebar-item"}>
              <Settings className="h-5 w-5" />
              <span>Configurações</span>
            </Link>
          </nav>
          
          {/* Footer */}
          <div className="p-4 border-t border-border space-y-2">
            <div className="arkivame-sidebar-item">
              <LifeBuoy className="h-5 w-5" />
              <span>Suporte</span>
            </div>
            <div className="arkivame-sidebar-item">
              <LogOut className="h-5 w-5" />
              <span>Sair</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 ml-64">
        {/* Top Header */}
        <header className="bg-background border-b border-border px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Buscar..." 
                className="arkivame-input pl-10 w-64"
              />
            </div>
            
            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full"></span>
            </Button>
            
            {/* User Menu */}
            <Button variant="ghost" size="sm" className="flex items-center gap-2">
              <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        </header>
        
        {/* Page Content */}
        <main className="p-6 lg:p-8">
          <CheckoutHandler organizationId={organizationId}>
            {children}
          </CheckoutHandler>
        </main>
      </div>
    </div>
  );
}
