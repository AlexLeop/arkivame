
'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Settings,
  Bell,
  Shield,
  Eye,
  Globe,
  Palette,
  Database,
  Users,
  Trash2,
  AlertTriangle,
  Save,
  Moon,
  Sun,
  Monitor
} from 'lucide-react';
import { ArkivameLogo } from '@/components/ui/arkivame-logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserMenu } from '@/components/shared/user-menu';
import { useToast } from '@/components/ui/use-toast';

export function SettingsPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: false,
      mentions: true,
      newKnowledge: true,
      weeklyDigest: false
    },
    privacy: {
      profileVisibility: 'organization',
      activityVisibility: 'team',
      searchHistory: true
    },
    appearance: {
      theme: 'system',
      compactMode: false,
      showAvatars: true
    },
    integrations: {
      slack: false,
      teams: false,
      autoCapture: true
    }
  });

  const handleSave = async (section: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast({
        title: "Settings saved",
        description: `Your ${section} settings have been updated.`,
        variant: "success"
      });
    } catch (error) {
      toast({
        title: "Error saving settings",
        description: "There was a problem saving your settings. Please try again.",
        variant: "destructive"
      });
    }
  };

  const updateSetting = (section: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [key]: value
      }
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <ArkivameLogo size="sm" />
            <div className="hidden md:block">
              <h1 className="text-xl font-semibold">Settings</h1>
              <p className="text-sm text-muted-foreground">Manage your preferences and account settings</p>
            </div>
          </div>
          <UserMenu />
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Tabs defaultValue="notifications" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
          </TabsList>

          {/* Notifications Settings */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="mr-2 h-5 w-5" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>
                  Choose how you&apos;d like to be notified about activity in Arkivame
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications via email
                      </p>
                    </div>
                    <Switch
                      checked={settings.notifications.email}
                      onCheckedChange={(checked) => updateSetting('notifications', 'email', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive push notifications in your browser
                      </p>
                    </div>
                    <Switch
                      checked={settings.notifications.push}
                      onCheckedChange={(checked) => updateSetting('notifications', 'push', checked)}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Mentions</Label>
                      <p className="text-sm text-muted-foreground">
                        When someone mentions you in a conversation
                      </p>
                    </div>
                    <Switch
                      checked={settings.notifications.mentions}
                      onCheckedChange={(checked) => updateSetting('notifications', 'mentions', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">New Knowledge Items</Label>
                      <p className="text-sm text-muted-foreground">
                        When new knowledge is captured in your organization
                      </p>
                    </div>
                    <Switch
                      checked={settings.notifications.newKnowledge}
                      onCheckedChange={(checked) => updateSetting('notifications', 'newKnowledge', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Weekly Digest</Label>
                      <p className="text-sm text-muted-foreground">
                        Summary of knowledge activity in your organization
                      </p>
                    </div>
                    <Switch
                      checked={settings.notifications.weeklyDigest}
                      onCheckedChange={(checked) => updateSetting('notifications', 'weeklyDigest', checked)}
                    />
                  </div>
                </div>

                <Button onClick={() => handleSave('notification')}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Notification Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy Settings */}
          <TabsContent value="privacy">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="mr-2 h-5 w-5" />
                  Privacy & Visibility
                </CardTitle>
                <CardDescription>
                  Control who can see your information and activity
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-3">
                    <Label className="text-base">Profile Visibility</Label>
                    <Select
                      value={settings.privacy.profileVisibility}
                      onValueChange={(value) => updateSetting('privacy', 'profileVisibility', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public - Everyone can see</SelectItem>
                        <SelectItem value="organization">Organization - Only team members</SelectItem>
                        <SelectItem value="private">Private - Only you</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-base">Activity Visibility</Label>
                    <Select
                      value={settings.privacy.activityVisibility}
                      onValueChange={(value) => updateSetting('privacy', 'activityVisibility', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="organization">Organization</SelectItem>
                        <SelectItem value="team">Team Only</SelectItem>
                        <SelectItem value="private">Private</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Save Search History</Label>
                      <p className="text-sm text-muted-foreground">
                        Keep track of your search history for suggestions
                      </p>
                    </div>
                    <Switch
                      checked={settings.privacy.searchHistory}
                      onCheckedChange={(checked) => updateSetting('privacy', 'searchHistory', checked)}
                    />
                  </div>
                </div>

                <Button onClick={() => handleSave('privacy')}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Privacy Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Settings */}
          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Palette className="mr-2 h-5 w-5" />
                  Appearance & Display
                </CardTitle>
                <CardDescription>
                  Customize how Arkivame looks and feels
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-3">
                    <Label className="text-base">Theme</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: 'light', label: 'Light', icon: Sun },
                        { value: 'dark', label: 'Dark', icon: Moon },
                        { value: 'system', label: 'System', icon: Monitor }
                      ].map(({ value, label, icon: Icon }) => (
                        <Button
                          key={value}
                          variant={settings.appearance.theme === value ? "default" : "outline"}
                          className="h-auto p-4 flex-col"
                          onClick={() => updateSetting('appearance', 'theme', value)}
                        >
                          <Icon className="h-5 w-5 mb-2" />
                          {label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Compact Mode</Label>
                      <p className="text-sm text-muted-foreground">
                        Use a more condensed layout to fit more content
                      </p>
                    </div>
                    <Switch
                      checked={settings.appearance.compactMode}
                      onCheckedChange={(checked) => updateSetting('appearance', 'compactMode', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Show Avatars</Label>
                      <p className="text-sm text-muted-foreground">
                        Display user avatars throughout the interface
                      </p>
                    </div>
                    <Switch
                      checked={settings.appearance.showAvatars}
                      onCheckedChange={(checked) => updateSetting('appearance', 'showAvatars', checked)}
                    />
                  </div>
                </div>

                <Button onClick={() => handleSave('appearance')}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Appearance Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Integrations Settings */}
          <TabsContent value="integrations">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="mr-2 h-5 w-5" />
                  Integrations
                </CardTitle>
                <CardDescription>
                  Connect Arkivame with your favorite tools and platforms
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-purple-600 rounded flex items-center justify-center text-white font-bold text-sm">
                          S
                        </div>
                        <div>
                          <p className="font-medium">Slack</p>
                          <p className="text-sm text-muted-foreground">
                            {settings.integrations.slack ? 'Connected' : 'Not connected'}
                          </p>
                        </div>
                      </div>
                      <Button 
                        variant={settings.integrations.slack ? "destructive" : "default"}
                        onClick={() => {
                          updateSetting('integrations', 'slack', !settings.integrations.slack);
                          toast({
                            title: settings.integrations.slack ? "Slack disconnected" : "Slack connected",
                            description: settings.integrations.slack 
                              ? "Your Slack workspace has been disconnected."
                              : "Your Slack workspace is now connected.",
                            variant: "success"
                          });
                        }}
                      >
                        {settings.integrations.slack ? 'Disconnect' : 'Connect'}
                      </Button>
                    </div>
                    {settings.integrations.slack && (
                      <div className="text-sm text-muted-foreground">
                        Connected to <strong>Your Workspace</strong> • 12 channels monitored
                      </div>
                    )}
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-sm">
                          T
                        </div>
                        <div>
                          <p className="font-medium">Microsoft Teams</p>
                          <p className="text-sm text-muted-foreground">
                            {settings.integrations.teams ? 'Connected' : 'Not connected'}
                          </p>
                        </div>
                      </div>
                      <Button 
                        variant={settings.integrations.teams ? "destructive" : "default"}
                        onClick={() => {
                          updateSetting('integrations', 'teams', !settings.integrations.teams);
                          toast({
                            title: settings.integrations.teams ? "Teams disconnected" : "Teams connected",
                            description: settings.integrations.teams 
                              ? "Your Teams workspace has been disconnected."
                              : "Your Teams workspace is now connected.",
                            variant: "success"
                          });
                        }}
                      >
                        {settings.integrations.teams ? 'Disconnect' : 'Connect'}
                      </Button>
                    </div>
                    {settings.integrations.teams && (
                      <div className="text-sm text-muted-foreground">
                        Connected to <strong>Your Organization</strong> • 8 teams monitored
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Auto-capture Conversations</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically capture conversations marked with reactions
                      </p>
                    </div>
                    <Switch
                      checked={settings.integrations.autoCapture}
                      onCheckedChange={(checked) => updateSetting('integrations', 'autoCapture', checked)}
                    />
                  </div>
                </div>

                <Button onClick={() => handleSave('integrations')}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Integration Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Account Settings */}
          <TabsContent value="account">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-red-600">
                    <AlertTriangle className="mr-2 h-5 w-5" />
                    Danger Zone
                  </CardTitle>
                  <CardDescription>
                    Irreversible actions that affect your account
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 border border-red-200 rounded-lg bg-red-50 dark:bg-red-950/10">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-red-900 dark:text-red-100">Delete Account</h3>
                        <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                          Permanently delete your account and all associated data. This action cannot be undone.
                        </p>
                      </div>
                      <Button 
                        variant="destructive"
                        onClick={() => {
                          toast({
                            title: "Feature coming soon",
                            description: "Account deletion will be available in a future update.",
                          });
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Account
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
