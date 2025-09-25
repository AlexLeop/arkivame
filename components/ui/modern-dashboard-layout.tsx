'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard,
  Search,
  Archive,
  BarChart3,
  Settings,
  Users,
  Zap,
  Bell,
  Menu,
  X,
  ChevronDown,
  LogOut,
  User,
  Building2,
  Sparkles
} from 'lucide-react';
import { ArkivameLogo } from '@/components/ui/arkivame-logo';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ModernDashboardLayoutProps {
  children: React.ReactNode;
  organization?: {
    id: string;
    name: string;
    slug: string;
    plan: 'FREE' | 'STARTER' | 'BUSINESS' | 'ENTERPRISE';
  };
}

export function ModernDashboardLayout({ children, organization }: ModernDashboardLayoutProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState(3);

  const navigation = [
    {
      name: 'Dashboard',
      href: organization ? `/dashboard/${organization.slug}` : '/dashboard',
      icon: LayoutDashboard,
      current: pathname === `/dashboard/${organization?.slug}` || pathname === '/dashboard'
    },
    {
      name: 'Knowledge Base',
      href: organization ? `/dashboard/${organization.slug}/knowledge` : '/knowledge',
      icon: Archive,
      current: pathname.includes('/knowledge')
    },
    {
      name: 'Search',
      href: organization ? `/dashboard/${organization.slug}/search` : '/search',
      icon: Search,
      current: pathname.includes('/search')
    },
    {
      name: 'Analytics',
      href: organization ? `/dashboard/${organization.slug}/analytics` : '/analytics',
      icon: BarChart3,
      current: pathname.includes('/analytics')
    },
    {
      name: 'Integrations',
      href: organization ? `/dashboard/${organization.slug}/integrations` : '/integrations',
      icon: Zap,
      current: pathname.includes('/integrations')
    },
    {
      name: 'Team',
      href: organization ? `/dashboard/${organization.slug}/team` : '/team',
      icon: Users,
      current: pathname.includes('/team')
    },
    {
      name: 'Settings',
      href: organization ? `/dashboard/${organization.slug}/settings` : '/settings',
      icon: Settings,
      current: pathname.includes('/settings')
    }
  ];

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case 'ENTERPRISE': return 'bg-gradient-to-r from-purple-500 to-pink-500';
      case 'BUSINESS': return 'bg-gradient-to-r from-blue-500 to-cyan-500';
      case 'STARTER': return 'bg-gradient-to-r from-green-500 to-emerald-500';
      case 'FREE': return 'bg-gradient-to-r from-gray-400 to-gray-500';
      default: return 'bg-gradient-to-r from-gray-400 to-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex h-full flex-col bg-white/80 backdrop-blur-xl border-r border-gray-200/50 shadow-xl">
          {/* Logo and Organization */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200/50">
            <div className="flex items-center space-x-3">
              <ArkivameLogo size="sm" />
              <div className="flex flex-col">
                <span className="font-semibold text-gray-900">Arkivame</span>
                {organization && (
                  <span className="text-sm text-gray-500 truncate max-w-[120px]">
                    {organization.name}
                  </span>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Plan Badge */}
          {organization && (
            <div className="px-6 py-4">
              <div className={`
                inline-flex items-center px-3 py-1 rounded-full text-xs font-medium text-white
                ${getPlanBadgeColor(organization.plan)}
              `}>
                <Sparkles className="h-3 w-3 mr-1" />
                {organization.plan}
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200
                    ${item.current
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }
                  `}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className={`
                    mr-3 h-5 w-5 transition-transform duration-200 group-hover:scale-110
                    ${item.current ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'}
                  `} />
                  {item.name}
                  {item.name === 'Dashboard' && notifications > 0 && (
                    <Badge className="ml-auto bg-red-500 text-white text-xs px-2 py-1">
                      {notifications}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-gray-200/50">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start p-3 h-auto">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={session?.user?.image || ''} />
                      <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                        {session?.user?.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {session?.user?.name || 'User'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {session?.user?.email}
                      </p>
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Building2 className="mr-2 h-4 w-4" />
                  Organization
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top bar */}
        <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-200/50">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              
              {/* Breadcrumb */}
              <div className="hidden md:flex items-center space-x-2 text-sm text-gray-500">
                <span>Dashboard</span>
                {organization && (
                  <>
                    <span>/</span>
                    <span className="text-gray-900 font-medium">{organization.name}</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5" />
                {notifications > 0 && (
                  <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1 min-w-[1.25rem] h-5">
                    {notifications}
                  </Badge>
                )}
              </Button>

              {/* Quick Actions */}
              <Button size="sm" className="arkivame-btn arkivame-btn-primary">
                <Archive className="h-4 w-4 mr-2" />
                Add Knowledge
              </Button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-6">
          <div className="arkivame-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

