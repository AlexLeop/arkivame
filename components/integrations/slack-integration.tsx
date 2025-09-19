
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Slack,
  Settings,
  Zap,
  Hash,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus
} from 'lucide-react';

interface SlackChannel {
  id: string;
  name: string;
  connected: boolean;
  messageCount: number;
}

interface SlackConfig {
  connected: boolean;
  workspaceUrl: string;
  workspaceName: string;
  botToken: string;
  channels: SlackChannel[];
  syncEnabled: boolean;
  autoImport: boolean;
  lastSync: string;
  totalImported: number;
  status: string;
}

export function SlackIntegration() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [config, setConfig] = useState<SlackConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [setupDialogOpen, setSetupDialogOpen] = useState(false);
  const [setupForm, setSetupForm] = useState({
    workspaceUrl: '',
    botToken: '',
    syncEnabled: true,
    autoImport: false
  });

  useEffect(() => {
    fetchSlackConfig();
  }, []);

  const fetchSlackConfig = async () => {
    try {
      const response = await fetch('/api/integrations/slack');
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
      }
    } catch (error) {
      console.error('Failed to fetch Slack config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      const response = await fetch('/api/integrations/slack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(setupForm)
      });

      if (response.ok) {
        toast({
          title: "Slack connected",
          description: "Successfully connected to Slack workspace.",
        });
        setSetupDialogOpen(false);
        fetchSlackConfig();
      } else {
        throw new Error('Connection failed');
      }
    } catch (error) {
      toast({
        title: "Connection failed",
        description: "Failed to connect to Slack. Please check your credentials.",
        variant: "destructive"
      });
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect Slack? This will stop all imports.')) return;

    try {
      const response = await fetch('/api/integrations/slack', {
        method: 'DELETE'
      });

      if (response.ok) {
        toast({
          title: "Slack disconnected",
          description: "Slack integration has been disabled.",
        });
        setConfig(null);
      }
    } catch (error) {
      toast({
        title: "Disconnect failed",
        description: "Failed to disconnect Slack integration.",
        variant: "destructive"
      });
    }
  };

  const handleToggleChannel = async (channelId: string, connected: boolean) => {
    try {
      const response = await fetch('/api/integrations/slack', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelUpdates: { [channelId]: connected }
        })
      });

      if (response.ok) {
        toast({
          title: connected ? "Channel connected" : "Channel disconnected",
          description: `Channel has been ${connected ? 'enabled' : 'disabled'} for imports.`,
        });
        fetchSlackConfig();
      }
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Failed to update channel settings.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Slack className="h-5 w-5" />
            Slack Integration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-4 bg-muted rounded animate-pulse" />
            <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
            <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!config?.connected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Slack className="h-5 w-5" />
            Slack Integration
            <Badge variant="secondary">Not Connected</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center py-8">
            <Slack className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Connect Slack</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
              Automatically import knowledge from your Slack channels. Keep your team&apos;s 
              conversations searchable and organized.
            </p>
            
            <Dialog open={setupDialogOpen} onOpenChange={setSetupDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Connect Slack
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Connect Slack Workspace</DialogTitle>
                  <DialogDescription>
                    Enter your Slack workspace details to start importing knowledge.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="workspaceUrl">Workspace URL</Label>
                    <Input
                      id="workspaceUrl"
                      value={setupForm.workspaceUrl}
                      onChange={(e) => setSetupForm(prev => ({ ...prev, workspaceUrl: e.target.value }))}
                      placeholder="https://your-workspace.slack.com"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="botToken">Bot Token</Label>
                    <Input
                      id="botToken"
                      type="password"
                      value={setupForm.botToken}
                      onChange={(e) => setSetupForm(prev => ({ ...prev, botToken: e.target.value }))}
                      placeholder="xoxb-your-bot-token"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Get your bot token from Slack App settings
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="syncEnabled"
                      checked={setupForm.syncEnabled}
                      onCheckedChange={(checked) => setSetupForm(prev => ({ ...prev, syncEnabled: checked }))}
                    />
                    <Label htmlFor="syncEnabled">Enable automatic sync</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="autoImport"
                      checked={setupForm.autoImport}
                      onCheckedChange={(checked) => setSetupForm(prev => ({ ...prev, autoImport: checked }))}
                    />
                    <Label htmlFor="autoImport">Auto-import new messages</Label>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setSetupDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleConnect} 
                    disabled={!setupForm.workspaceUrl || !setupForm.botToken}
                  >
                    Connect Slack
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Slack className="h-5 w-5" />
            <CardTitle>Slack Integration</CardTitle>
            <Badge className="bg-green-500">
              <CheckCircle className="mr-1 h-3 w-3" />
              Connected
            </Badge>
          </div>
          <Button variant="outline" size="sm" onClick={handleDisconnect}>
            Disconnect
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Connection Status */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="space-y-1">
            <div className="text-2xl font-bold text-green-500">{config.totalImported}</div>
            <div className="text-sm text-muted-foreground">Messages Imported</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold">{config.channels.filter(c => c.connected).length}</div>
            <div className="text-sm text-muted-foreground">Active Channels</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold">
              {config.lastSync ? new Date(config.lastSync).toLocaleDateString() : 'Never'}
            </div>
            <div className="text-sm text-muted-foreground">Last Sync</div>
          </div>
        </div>

        <Separator />

        {/* Workspace Info */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Workspace</h3>
              <p className="text-sm text-muted-foreground">{config.workspaceName}</p>
            </div>
            <Badge variant="outline">{config.workspaceUrl}</Badge>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              <span className="font-medium">Auto-sync enabled</span>
            </div>
            <Switch checked={config.syncEnabled} />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="font-medium">Auto-import new messages</span>
            </div>
            <Switch checked={config.autoImport} />
          </div>
        </div>

        <Separator />

        {/* Channels */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Connected Channels</h3>
            <Badge variant="secondary">{config.channels.length} channels</Badge>
          </div>

          <div className="space-y-2">
            {config.channels.map((channel) => (
              <div key={channel.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{channel.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {channel.messageCount} messages imported
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {channel.connected ? (
                    <Badge className="bg-green-500">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Connected
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <XCircle className="mr-1 h-3 w-3" />
                      Disconnected
                    </Badge>
                  )}
                  <Switch 
                    checked={channel.connected}
                    onCheckedChange={(checked) => handleToggleChannel(channel.id, checked)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Settings */}
        <div className="flex justify-between">
          <Button variant="outline">
            <Settings className="mr-2 h-4 w-4" />
            Advanced Settings
          </Button>
          <Button>
            <Zap className="mr-2 h-4 w-4" />
            Sync Now
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
