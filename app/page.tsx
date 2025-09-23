
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

  // Se o usuário estiver autenticado, redireciona para o dashboard apropriado
  if (session?.user) {
    if (session.user.role === 'SUPER_ADMIN') {
      redirect('/super-admin');
    }
    
    if (session.user.organizations && session.user.organizations.length > 0) {
      const firstOrg = session.user.organizations[0];
      redirect(`/dashboard/${firstOrg.slug || firstOrg.id}`);
    }
    
    // Fallback para usuários autenticados sem organizações
    redirect('/dashboard');
  }

  // Landing Page for non-authenticated users or main domain
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4">
        <div className="container mx-auto text-center max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
            Choose the plan that fits your team size and needs. All plans include our core features.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <div className="p-8 bg-background rounded-lg border shadow-sm">
              <h3 className="text-2xl font-bold mb-2">Free</h3>
              <div className="text-4xl font-bold mb-4">$0<span className="text-lg font-normal text-muted-foreground">/month</span></div>
              <p className="text-muted-foreground mb-6">Perfect for small teams getting started</p>
              <ul className="text-left space-y-3 mb-8">
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Up to 100 knowledge items</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Basic search and filters</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Slack integration</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> 5 team members</li>
              </ul>
              <Link href="/signup?plan=free">
                <Button variant="outline" className="w-full">Get Started</Button>
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="p-8 bg-primary text-primary-foreground rounded-lg border-2 border-primary shadow-lg relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-secondary text-secondary-foreground px-4 py-1 rounded-full text-sm font-medium">
                Most Popular
              </div>
              <h3 className="text-2xl font-bold mb-2">Pro</h3>
              <div className="text-4xl font-bold mb-4">$29<span className="text-lg font-normal opacity-80">/month</span></div>
              <p className="opacity-80 mb-6">For growing teams that need more power</p>
              <ul className="text-left space-y-3 mb-8">
                <li className="flex items-center"><span className="text-green-400 mr-2">✓</span> Unlimited knowledge items</li>
                <li className="flex items-center"><span className="text-green-400 mr-2">✓</span> AI-powered insights</li>
                <li className="flex items-center"><span className="text-green-400 mr-2">✓</span> All integrations</li>
                <li className="flex items-center"><span className="text-green-400 mr-2">✓</span> Advanced analytics</li>
                <li className="flex items-center"><span className="text-green-400 mr-2">✓</span> Up to 50 team members</li>
              </ul>
              <Link href="/signup?plan=pro">
                <Button variant="secondary" className="w-full">Start Free Trial</Button>
              </Link>
            </div>

            {/* Enterprise Plan */}
            <div className="p-8 bg-background rounded-lg border shadow-sm">
              <h3 className="text-2xl font-bold mb-2">Enterprise</h3>
              <div className="text-4xl font-bold mb-4">Custom</div>
              <p className="text-muted-foreground mb-6">For large organizations with custom needs</p>
              <ul className="text-left space-y-3 mb-8">
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Everything in Pro</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Custom integrations</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Dedicated support</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> SLA guarantees</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Unlimited team members</li>
              </ul>
              <Link href="/contact">
                <Button variant="outline" className="w-full">Contact Sales</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="container mx-auto text-center max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Trusted by teams worldwide
          </h2>
          <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
            See how Arkivame is helping teams preserve and leverage their collective knowledge.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                quote: "Arkivame transformed how we capture and share knowledge. We've reduced onboarding time by 60% and never lose important decisions anymore.",
                author: "Sarah Chen",
                role: "Engineering Manager",
                company: "TechCorp"
              },
              {
                quote: "The AI-powered insights help us identify knowledge gaps before they become problems. It's like having a knowledge management expert on our team.",
                author: "Marcus Rodriguez",
                role: "Head of Operations",
                company: "ScaleUp Inc"
              },
              {
                quote: "Integration with our existing tools was seamless. Our team adopted it immediately and now we can't imagine working without it.",
                author: "Emily Watson",
                role: "Product Director",
                company: "InnovateLab"
              }
            ].map((testimonial, index) => (
              <div key={index} className="p-6 bg-background rounded-lg border shadow-sm">
                <p className="text-muted-foreground mb-4 italic">&ldquo;{testimonial.quote}&rdquo;</p>
                <div className="font-semibold">{testimonial.author}</div>
                <div className="text-sm text-muted-foreground">{testimonial.role} at {testimonial.company}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to transform your team&apos;s knowledge?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of teams who have already eliminated knowledge silos and improved collaboration with Arkivame.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/signup">
              <Button size="lg" className="px-8">
                Start Your Free Trial
                <span className="ml-2">→</span>
              </Button>
            </Link>
            <Link href="/demo">
              <Button variant="outline" size="lg" className="px-8">
                Schedule a Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/50">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <ArkivameLogo size="sm" />
              <p className="text-sm text-muted-foreground">
                Transform conversations into living knowledge with AI-powered insights and seamless integrations.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#features" className="text-muted-foreground hover:text-foreground">Features</Link></li>
                <li><Link href="#pricing" className="text-muted-foreground hover:text-foreground">Pricing</Link></li>
                <li><Link href="/integrations" className="text-muted-foreground hover:text-foreground">Integrations</Link></li>
                <li><Link href="/security" className="text-muted-foreground hover:text-foreground">Security</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/about" className="text-muted-foreground hover:text-foreground">About</Link></li>
                <li><Link href="/blog" className="text-muted-foreground hover:text-foreground">Blog</Link></li>
                <li><Link href="/careers" className="text-muted-foreground hover:text-foreground">Careers</Link></li>
                <li><Link href="/contact" className="text-muted-foreground hover:text-foreground">Contact</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/help" className="text-muted-foreground hover:text-foreground">Help Center</Link></li>
                <li><Link href="/docs" className="text-muted-foreground hover:text-foreground">Documentation</Link></li>
                <li><Link href="/api" className="text-muted-foreground hover:text-foreground">API Reference</Link></li>
                <li><Link href="/status" className="text-muted-foreground hover:text-foreground">Status</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-muted-foreground">
              © 2024 Arkivame. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">Privacy Policy</Link>
              <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground">Terms of Service</Link>
              <Link href="/cookies" className="text-sm text-muted-foreground hover:text-foreground">Cookie Policy</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Tenant Type Debug Info (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-muted p-3 rounded-lg text-sm">
          <div>Tenant: landing</div>
          <div>User: {session?.user?.name || 'Not authenticated'}</div>
        </div>
      )}
    </div>
  );
}
