
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { 
  Slack, 
  Bot, 
  GitFork, 
  ExternalLink, 
  CheckCircle, 
  XCircle,
  RefreshCcw,
  MessageSquare
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface Integration {
  id: string;
  name: string;
  type: 'inbound' | 'outbound';
  status: 'connected' | 'disconnected' | 'pending';
  description: string;
  icon: React.ElementType;
  connectUrl?: string;
  manageUrl?: string;
}

export default function IntegrationsPage() {
  const { data: session } = useSession();
  const params = useParams();
  const organizationId = params.organizationId as string;

  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectingIntegration, setConnectingIntegration] = useState<string | null>(null);

  const fetchIntegrations = useCallback(async () => {
    setLoading(true);
    try {
      
      const mockIntegrations: Integration[] = [
        {
          id: 'slack',
          name: 'Slack',
          type: 'inbound',
          status: 'disconnected',
          description: 'Capture conversations from Slack channels.',
          icon: Slack,
          connectUrl: `/api/integrations/slack/connect?organizationId=${organizationId}`,
        },
        {
          id: 'discord',
          name: 'Discord',
          type: 'inbound',
          status: 'disconnected',
          description: 'Archive discussions from Discord servers.',
          icon: Bot,
          connectUrl: `/api/integrations/discord/connect?organizationId=${organizationId}`,
        },
        {
          id: 'google-chat',
          name: 'Google Chat',
          type: 'inbound',
          status: 'disconnected',
          description: 'Integrate with Google Chat for archiving.',
          icon: Bot,
          connectUrl: `/api/integrations/google-chat/connect?organizationId=${organizationId}`,
        },
        {
          id: 'mattermost',
          name: 'Mattermost',
          type: 'inbound',
          status: 'disconnected',
          description: 'Connect to Mattermost for team communication.',
          icon: MessageSquare,
          connectUrl: `/api/integrations/mattermost/connect?organizationId=${organizationId}`,
        },
        {
          id: 'notion',
          name: 'Notion',
          type: 'outbound',
          status: 'disconnected',
          description: 'Export knowledge items to Notion pages.',
          icon: ExternalLink,
          connectUrl: `/api/integrations/notion/connect?organizationId=${organizationId}`,
        },
        {
          id: 'confluence',
          name: 'Confluence',
          type: 'outbound',
          status: 'disconnected',
          description: 'Publish archived content to Confluence.',
          icon: ExternalLink,
          connectUrl: `/api/integrations/confluence/connect?organizationId=${organizationId}`,
        },
        {
          id: 'google-docs',
          name: 'Google Docs',
          type: 'outbound',
          status: 'disconnected',
          description: 'Save knowledge as Google Docs.',
          icon: ExternalLink,
          connectUrl: `/api/integrations/google-docs/connect?organizationId=${organizationId}`,
        },
        {
          id: 'github-wiki',
          name: 'GitHub Wiki',
          type: 'outbound',
          status: 'disconnected',
          description: 'Push knowledge to your GitHub Wiki.',
          icon: GitFork,
          connectUrl: `/api/integrations/github-wiki/connect?organizationId=${organizationId}`,
        },
      ];

      
      const response = await fetch(`/api/integrations?organizationId=${organizationId}`);
      if (response.ok) {
        const realStatus = await response.json();
        const updatedIntegrations = mockIntegrations.map(integration => ({
          ...integration,
          status: realStatus[integration.id] || integration.status,
        }));
        setIntegrations(updatedIntegrations);
      } else {
        setIntegrations(mockIntegrations); // Fallback to mock if API fails
      }

    } catch (error) {
      console.error('Failed to fetch integrations:', error);
      toast.error('Failed to load integrations.');
      setIntegrations([]);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    if (organizationId) {
      fetchIntegrations();
    }
  }, [organizationId, fetchIntegrations]);

  const handleConnect = async (integrationId: string, connectUrl?: string) => {
    if (!connectUrl) {
      toast.error('Connect URL not available for this integration.');
      return;
    }

    setConnectingIntegration(integrationId);
    try {
      
      toast.info(`Connecting to ${integrationId}...`);
      window.location.href = connectUrl; // Redirect to OAuth provider

      

    } catch (error) {
      console.error(`Error connecting to ${integrationId}:`, error);
      toast.error(`Failed to connect to ${integrationId}.`);
    } finally {
      setConnectingIntegration(null);
    }
  };

  const handleDisconnect = async (integrationId: string) => {
    setConnectingIntegration(integrationId);
    try {
      const response = await fetch(`/api/integrations/${integrationId}/disconnect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId }),
      });

      if (response.ok) {
        toast.success(`${integrationId} disconnected successfully.`);
        fetchIntegrations();
      } else {
        toast.error(`Failed to disconnect ${integrationId}.`);
      }
    } catch (error) {
      console.error(`Error disconnecting ${integrationId}:`, error);
      toast.error(`Failed to disconnect ${integrationId}.`);
    } finally {
      setConnectingIntegration(null);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Manage Integrations</h1>
      <p className="text-muted-foreground mb-8">
        Connect Arkivame to your favorite tools to capture and export knowledge.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrations.map((integration) => (
          <Card key={integration.id} className="flex flex-col">
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center space-x-2">
                <integration.icon className="h-6 w-6 text-primary" />
                <CardTitle className="text-lg">{integration.name}</CardTitle>
              </div>
              <Badge variant={integration.status === 'connected' ? 'default' : 'secondary'}>
                {integration.status === 'connected' ? 'Connected' : 'Disconnected'}
              </Badge>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
              <CardDescription className="mb-4">{integration.description}</CardDescription>
              <div className="flex items-center justify-between">
                {integration.status === 'connected' ? (
                  <Button 
                    variant="outline" 
                    onClick={() => handleDisconnect(integration.id)}
                    disabled={connectingIntegration === integration.id}
                  >
                    {connectingIntegration === integration.id ? 'Disconnecting...' : 'Disconnect'}
                  </Button>
                ) : (
                  <Button 
                    onClick={() => handleConnect(integration.id, integration.connectUrl)}
                    disabled={connectingIntegration === integration.id}
                  >
                    {connectingIntegration === integration.id ? 'Connecting...' : 'Connect'}
                  </Button>
                )}
                {integration.manageUrl && (
                  <Button variant="link" size="sm" asChild>
                    <a href={integration.manageUrl} target="_blank" rel="noopener noreferrer">
                      Manage <ExternalLink className="ml-1 h-4 w-4" />
                    </a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Separator className="my-10" />

      <h2 className="text-2xl font-bold mb-4">Integration Status Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Inbound Integrations</CardTitle>
            <CardDescription>Capture knowledge from these platforms.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {integrations.filter(i => i.type === 'inbound').map(i => (
                <li key={i.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {i.status === 'connected' ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <span>{i.name}</span>
                  </div>
                  <Badge variant={i.status === 'connected' ? 'default' : 'secondary'}>
                    {i.status === 'connected' ? 'Connected' : 'Disconnected'}
                  </Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Outbound Integrations</CardTitle>
            <CardDescription>Export knowledge to these platforms.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {integrations.filter(i => i.type === 'outbound').map(i => (
                <li key={i.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {i.status === 'connected' ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <span>{i.name}</span>
                  </div>
                  <Badge variant={i.status === 'connected' ? 'default' : 'secondary'}>
                    {i.status === 'connected' ? 'Connected' : 'Disconnected'}
                  </Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      
    </div>
  );
}


