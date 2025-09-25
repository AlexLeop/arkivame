
import type { Metadata, Viewport } from 'next';
import { headers } from 'next/headers';
import ClientProviders from '@/components/providers/client-providers';

import { Inter, Poppins } from 'next/font/google';
import './globals.css';
import '../styles/arkivame-design-system.css';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter'
});

const poppins = Poppins({ 
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  subsets: ['latin'],
  variable: '--font-poppins'
});

export const metadata: Metadata = {
  title: 'Arkivame - Transform Conversations into Living Knowledge',
  description: 'Combat corporate amnesia by transforming ephemeral Slack and Teams conversations into a permanent, searchable knowledge base.',
  keywords: 'knowledge management, slack integration, teams integration, corporate knowledge, documentation',
  authors: [{ name: 'Arkivame Team' }],
  openGraph: {
    type: 'website',
    title: 'Arkivame - Transform Conversations into Living Knowledge',
    description: 'Combat corporate amnesia by transforming ephemeral conversations into permanent, searchable knowledge.',
    siteName: 'Arkivame',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Arkivame - Transform Conversations into Living Knowledge',
    description: 'Combat corporate amnesia by transforming ephemeral conversations into permanent, searchable knowledge.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = headers();
  const tenantType = headersList.get('x-tenant-type');
  const organizationSlug = headersList.get('x-organization-slug');
  
  // Note: Dynamic metadata should be handled at the page level, not in layout
  
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${poppins.variable}`}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <meta name="color-scheme" content="light dark" />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased arkivame-scrollbar">
        <ClientProviders>
          <div className="relative flex min-h-screen flex-col">
            <main className="flex-1">
              {children}
            </main>
          </div>
        </ClientProviders>
        
        {/* Background Pattern */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-secondary/5 to-transparent rotate-12 transform" />
          <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-tr from-primary/5 to-transparent -rotate-12 transform" />
        </div>
      </body>
    </html>
  );
}
