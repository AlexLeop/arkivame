
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  CheckCircle, 
  MessageSquare, 
  Search, 
  Archive, 
  Zap,
  Users,
  BarChart3,
  Shield,
  Database
} from 'lucide-react';
import { ArkivameLogo } from '@/components/ui/arkivame-logo';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const features = [
  {
    icon: MessageSquare,
    title: 'Smart Thread Capture',
    description: 'Automatically capture important conversations from Slack and Teams with a simple emoji reaction.'
  },
  {
    icon: Search,
    title: 'Advanced Search & Filters',
    description: 'Powerful search with hierarchical tags, saved filters, and intelligent suggestions.'
  },
  {
    icon: Archive,
    title: 'Knowledge Organization',
    description: 'Transform ephemeral conversations into permanent, searchable knowledge assets.'
  },
  {
    icon: BarChart3,
    title: 'Analytics & Insights',
    description: 'Track knowledge usage, identify gaps, and understand team communication patterns.'
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'Role-based access control, audit logs, and complete data isolation per organization.'
  },
  {
    icon: Database,
    title: 'Multitenant Architecture',
    description: 'Robust isolation with per-organization data, settings, and customizations.'
  }
];

const plans = [
  {
    name: 'Starter',
    price: '$29',
    period: 'per month',
    description: 'Perfect for small teams getting started',
    features: [
      'Up to 25 users',
      'Up to 200 archived items/month',
      'Basic search',
      'Slack & Teams integration',
      'Email support'
    ],
    popular: false
  },
  {
    name: 'Business',
    price: '$59',
    period: 'per month',
    description: 'Advanced features for growing teams',
    features: [
      'Unlimited users',
      'Unlimited archived items',
      'Advanced search & filters',
      'Hierarchical tags',
      'Analytics dashboard',
      'Priority support'
    ],
    popular: true
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: 'pricing',
    description: 'Full-featured solution for large organizations',
    features: [
      'Everything in Business',
      'Custom integrations',
      'Advanced analytics',
      'Dedicated support',
      'Custom branding',
      'SLA guarantee'
    ],
    popular: false
  }
];

const testimonials = [
  {
    quote: '"Arkivame transformed how we handle knowledge. No more lost conversations in Slack."',
    author: "Sarah Chen",
    role: "Engineering Manager",
    company: "TechCorp"
  },
  {
    quote: "The advanced search and tagging system is exactly what we needed for our distributed team.",
    author: "Michael Rodriguez", 
    role: "Head of Operations",
    company: "StartupXYZ"
  }
];

export function ArkivameLandingPage() {
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b arkivame-shadow">
        <div className="arkivame-container">
          <div className="flex items-center justify-between h-16">
            <ArkivameLogo variant="full" size="md" />
            
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-sm font-medium hover:text-secondary transition-colors">
                Features
              </Link>
              <Link href="#pricing" className="text-sm font-medium hover:text-secondary transition-colors">
                Pricing
              </Link>
              <Link href="#about" className="text-sm font-medium hover:text-secondary transition-colors">
                About
              </Link>
            </nav>
            
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="arkivame-button-primary">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>
      
      {/* Hero Section */}
      <section className="relative py-20 md:py-32">
        <div className="arkivame-container">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Badge variant="secondary" className="mb-6">
                Combat Corporate Amnesia
              </Badge>
              
              <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Transform Conversations into Living Knowledge
              </h1>
              
              <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
                Stop losing valuable insights in Slack and Teams. Arkivame automatically captures, 
                organizes, and makes your team conversations searchable with advanced filtering and AI-powered insights.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/signup">
                  <Button size="lg" className="arkivame-button-primary text-lg px-8 py-4">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="text-lg px-8 py-4">
                  Watch Demo
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
        
        {/* Background Elements */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-secondary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        </div>
      </section>
      
      {/* Features Section */}
      <section id="features" className="py-20 bg-muted/30">
        <div className="arkivame-container">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Everything you need to preserve team knowledge
            </h2>
            <p className="text-lg text-muted-foreground">
              Arkivame provides a comprehensive solution for capturing, organizing, and retrieving 
              your team&apos;s most valuable conversations.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="arkivame-card p-6 hover-lift"
              >
                <div className="w-12 h-12 bg-secondary/20 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-secondary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Pricing Section */}
      <section id="pricing" className="py-20">
        <div className="arkivame-container">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Simple, transparent pricing
            </h2>
            <p className="text-lg text-muted-foreground">
              Choose the plan that fits your team size and needs. All plans include core features.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`arkivame-card p-8 relative hover-lift ${
                  plan.popular ? 'border-secondary shadow-lg' : ''
                }`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-secondary">
                    Most Popular
                  </Badge>
                )}
                
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground ml-1">/{plan.period}</span>
                  </div>
                  <p className="text-muted-foreground">{plan.description}</p>
                </div>
                
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-secondary mt-0.5 mr-3 shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className={`w-full ${plan.popular ? 'arkivame-button-primary' : 'arkivame-button-secondary'}`}
                  asChild
                >
                  <Link href="/signup">
                    Get Started
                  </Link>
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Testimonials */}
      <section className="py-20 bg-muted/30">
        <div className="arkivame-container">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Trusted by teams worldwide
            </h2>
            <p className="text-lg text-muted-foreground">
              See what teams are saying about Arkivame
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="arkivame-card p-8 text-center">
              <blockquote className="text-xl md:text-2xl font-medium mb-6 italic">
                &ldquo;{testimonials[activeTestimonial].quote}&rdquo;
              </blockquote>
              <div className="flex items-center justify-center space-x-4">
                <div className="text-center">
                  <div className="font-semibold">{testimonials[activeTestimonial].author}</div>
                  <div className="text-sm text-muted-foreground">
                    {testimonials[activeTestimonial].role} at {testimonials[activeTestimonial].company}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-center space-x-2 mt-8">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === activeTestimonial ? 'bg-secondary' : 'bg-muted-foreground/30'
                    }`}
                    onClick={() => setActiveTestimonial(index)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20">
        <div className="arkivame-container">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to transform your team&apos;s knowledge?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join thousands of teams who never lose important conversations again.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button size="lg" className="arkivame-button-primary text-lg px-8 py-4">
                  Start Your Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="text-lg px-8 py-4">
                Schedule Demo
              </Button>
            </div>
            
            <p className="text-sm text-muted-foreground mt-4">
              No credit card required • 14-day free trial • Cancel anytime
            </p>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-12 border-t bg-muted/30">
        <div className="arkivame-container">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-4 mb-4 md:mb-0">
              <ArkivameLogo variant="full" size="md" />
              <span className="text-sm text-muted-foreground">
                © 2024 Arkivame. All rights reserved.
              </span>
            </div>
            
            <div className="flex items-center space-x-6">
              <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Terms
              </Link>
              <Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default ArkivameLandingPage;
