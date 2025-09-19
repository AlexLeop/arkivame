
'use client';

import { useState } from 'react';
import { 
  HelpCircle,
  Search,
  Book,
  MessageCircle,
  Mail,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Play,
  FileText,
  Lightbulb
} from 'lucide-react';
import { ArkivameLogo } from '@/components/ui/arkivame-logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { UserMenu } from '@/components/shared/user-menu';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQ[] = [
  {
    id: '1',
    question: 'How do I connect Slack to Arkivame?',
    answer: 'To connect Slack, go to Settings > Integrations, click "Connect" next to Slack, and follow the authorization process. Once connected, you can choose which channels to monitor for knowledge capture.',
    category: 'integrations'
  },
  {
    id: '2',
    question: 'How does automatic conversation capture work?',
    answer: 'When someone reacts to a message with 📚 (book emoji) or ⭐ (star emoji) in your connected Slack/Teams channels, Arkivame automatically captures that conversation thread and adds it to your knowledge base with relevant tags.',
    category: 'capture'
  },
  {
    id: '3',
    question: 'Can I manually add knowledge items?',
    answer: 'Yes! You can manually add knowledge items by going to your dashboard and clicking "Add Knowledge". You can enter a title, content, tags, and specify the source.',
    category: 'knowledge'
  },
  {
    id: '4',
    question: 'How do I organize knowledge with tags?',
    answer: 'Tags help categorize and organize your knowledge. You can create hierarchical tags (like "Engineering > Backend > Database") and assign multiple tags to each knowledge item. Use the Tags section in your dashboard to manage them.',
    category: 'organization'
  },
  {
    id: '5',
    question: 'What\'s the difference between plans?',
    answer: 'Starter plan supports up to 25 users and basic features. Business plan includes unlimited users, advanced analytics, priority support, and additional integrations.',
    category: 'billing'
  },
  {
    id: '6',
    question: 'Is my data secure and private?',
    answer: 'Yes, absolutely. Each organization\'s data is completely isolated. We use industry-standard encryption, and you can control visibility settings. Super admins cannot access your organization\'s data.',
    category: 'security'
  }
];

const categories = [
  { id: 'all', name: 'All Topics', icon: Book },
  { id: 'integrations', name: 'Integrations', icon: ExternalLink },
  { id: 'capture', name: 'Knowledge Capture', icon: Lightbulb },
  { id: 'organization', name: 'Organization', icon: FileText },
  { id: 'billing', name: 'Plans & Billing', icon: MessageCircle },
  { id: 'security', name: 'Security', icon: HelpCircle },
];

export function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [openFAQ, setOpenFAQ] = useState<string | null>(null);

  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <ArkivameLogo size="sm" />
            <div className="hidden md:block">
              <h1 className="text-xl font-semibold">Help & Support</h1>
              <p className="text-sm text-muted-foreground">Find answers and get assistance</p>
            </div>
          </div>
          <UserMenu />
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-6">
            <HelpCircle className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-4">How can we help you?</h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Search our knowledge base or browse common questions below
          </p>
          
          {/* Search */}
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search for help..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-lg"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Categories */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Browse by Category</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {categories.map(category => {
                  const Icon = category.icon;
                  const count = category.id === 'all' ? faqs.length : faqs.filter(f => f.category === category.id).length;
                  
                  return (
                    <Button
                      key={category.id}
                      variant={selectedCategory === category.id ? "default" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => setSelectedCategory(category.id)}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      {category.name}
                      <Badge variant="secondary" className="ml-auto">
                        {count}
                      </Badge>
                    </Button>
                  );
                })}
              </CardContent>
            </Card>

            {/* Contact Support */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Need More Help?</CardTitle>
                <CardDescription>
                  Can&apos;t find what you&apos;re looking for?
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full" variant="outline">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Live Chat
                </Button>
                <Button className="w-full" variant="outline">
                  <Mail className="mr-2 h-4 w-4" />
                  Email Support
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* FAQ Content */}
          <div className="lg:col-span-3">
            {/* Quick Links */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-6">Quick Start</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-6 text-center">
                    <Play className="h-8 w-8 text-primary mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">Getting Started</h3>
                    <p className="text-sm text-muted-foreground">
                      Learn the basics of using Arkivame
                    </p>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-6 text-center">
                    <ExternalLink className="h-8 w-8 text-primary mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">Integrations</h3>
                    <p className="text-sm text-muted-foreground">
                      Connect Slack and Teams
                    </p>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-6 text-center">
                    <Lightbulb className="h-8 w-8 text-primary mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">Best Practices</h3>
                    <p className="text-sm text-muted-foreground">
                      Tips for effective knowledge management
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* FAQs */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">
                  Frequently Asked Questions
                </h2>
                <Badge variant="outline">
                  {filteredFAQs.length} questions
                </Badge>
              </div>

              {filteredFAQs.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No results found</h3>
                    <p className="text-muted-foreground">
                      Try adjusting your search terms or browse by category
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {filteredFAQs.map((faq) => (
                    <Card key={faq.id}>
                      <Collapsible 
                        open={openFAQ === faq.id} 
                        onOpenChange={(open) => setOpenFAQ(open ? faq.id : null)}
                      >
                        <CollapsibleTrigger asChild>
                          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-left text-lg">
                                {faq.question}
                              </CardTitle>
                              {openFAQ === faq.id ? (
                                <ChevronDown className="h-5 w-5 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                          </CardHeader>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <CardContent className="pt-0">
                            <p className="text-muted-foreground leading-relaxed">
                              {faq.answer}
                            </p>
                          </CardContent>
                        </CollapsibleContent>
                      </Collapsible>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
