
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getOrganizationByTenant } from '@/lib/tenant';
import { ArkivameLogo } from '@/components/ui/arkivame-logo';
import { Button } from '@/components/ui/button';
import { SuperAdminDashboard } from '@/components/dashboard/super-admin-dashboard';
import { OrganizationDashboard } from '@/components/dashboard/organization-dashboard';
import { UserMenu } from '@/components/shared/user-menu';
import Link from 'next/link';

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  const headersList = headers();
  const tenantType = headersList.get('x-tenant-type');
  
  // Super Admin Dashboard
  if (tenantType === 'super-admin') {
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      redirect('/login');
    }
    return <SuperAdminDashboard />;
  }
  
  // Organization Dashboard
  if (tenantType === 'organization') {
    const subdomain = headersList.get('x-tenant-subdomain');
    const domain = headersList.get('x-tenant-domain');
    
    // Validate organization exists
    let organization = null;
    try {
      organization = await getOrganizationByTenant(subdomain || undefined, domain || undefined);
    } catch (error) {
      console.error('Error validating organization:', error);
    }
    
    if (!organization) {
      redirect('/');
    }
    
    if (!session?.user) {
      redirect('/login');
    }
    
    return <OrganizationDashboard organization={organization} />;
  }
  
  // Landing Page for non-authenticated users or main domain
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <ArkivameLogo size="md" />
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="#features" className="text-sm font-medium hover:text-primary transition-colors">
              Features
            </Link>
            <Link href="#pricing" className="text-sm font-medium hover:text-primary transition-colors">
              Pricing
            </Link>
            <Link href="#about" className="text-sm font-medium hover:text-primary transition-colors">
              About
            </Link>
          </nav>
          <UserMenu />
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="inline-flex items-center px-4 py-2 bg-secondary/10 rounded-full text-sm mb-8">
            <span className="bg-secondary text-secondary-foreground px-2 py-1 rounded-full text-xs font-medium mr-3">
              Combat Corporate Amnesia
            </span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Transform <span className="text-secondary">Conversations</span> into Living Knowledge
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Stop losing valuable insights in Slack and Teams. Arkivame automatically captures, organizes, and makes your team conversations searchable with advanced filtering and AI-powered insights.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Link href="/signup">
              <Button size="lg" className="px-8">
                Start Free Trial
                <span className="ml-2">→</span>
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="px-8">
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-muted/50">
        <div className="container mx-auto text-center max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Everything you need to preserve team knowledge
          </h2>
          <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
            Arkivame provides a comprehensive solution for capturing, organizing, and retrieving your team&apos;s most valuable conversations.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Smart Thread Capture",
                description: "Automatically capture important conversations from Slack and Teams with a simple emoji reaction.",
                icon: "💬"
              },
              {
                title: "Advanced Search & Filters",
                description: "Powerful search with hierarchical tags, saved filters, and intelligent suggestions.",
                icon: "🔍"
              },
              {
                title: "Knowledge Organization",
                description: "Transform ephemeral conversations into permanent, searchable knowledge assets.",
                icon: "📚"
              },
              {
                title: "Analytics & Insights",
                description: "Track knowledge usage, identify gaps, and understand team communication patterns.",
                icon: "📊"
              },
              {
                title: "Enterprise Security",
                description: "Role-based access control, audit logs, and complete data isolation per organization.",
                icon: "🔒"
              },
              {
                title: "Multi-tenant Architecture",
                description: "Scalable infrastructure supporting unlimited organizations with complete data isolation.",
                icon: "🏢"
              }
            ].map((feature, index) => (
              <div key={index} className="p-6 bg-background rounded-lg border shadow-sm hover:shadow-md transition-shadow">
                <div className="text-3xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tenant Type Debug Info (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-muted p-3 rounded-lg text-sm">
          <div>Tenant: {tenantType || 'landing'}</div>
          <div>User: {session?.user?.name || 'Not authenticated'}</div>
        </div>
      )}
    </div>
  );
}
