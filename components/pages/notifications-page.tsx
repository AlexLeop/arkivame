
'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Bell,
  CheckCircle,
  Clock,
  Eye,
  EyeOff,
  Trash2,
  Users,
  MessageSquare,
  Archive,
  Settings
} from 'lucide-react';
import { ArkivameLogo } from '@/components/ui/arkivame-logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserMenu } from '@/components/shared/user-menu';
import { useToast } from '@/components/ui/use-toast';

interface Notification {
  id: string;
  type: 'mention' | 'knowledge' | 'system' | 'team';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  avatar?: string;
  sender?: string;
}

const sampleNotifications: Notification[] = [
  {
    id: '1',
    type: 'mention',
    title: 'Sarah Chen mentioned you',
    message: 'in "Project Alpha Planning Discussion"',
    timestamp: '2 minutes ago',
    read: false,
    sender: 'Sarah Chen',
    actionUrl: '/knowledge/1'
  },
  {
    id: '2',
    type: 'knowledge',
    title: 'New knowledge item captured',
    message: 'Database Migration Best Practices was added to Engineering',
    timestamp: '1 hour ago',
    read: false,
    actionUrl: '/knowledge/2'
  },
  {
    id: '3',
    type: 'team',
    title: 'Mike Johnson joined your organization',
    message: 'Welcome Mike to the team!',
    timestamp: '3 hours ago',
    read: true,
    sender: 'System'
  },
  {
    id: '4',
    type: 'system',
    title: 'Weekly digest is ready',
    message: 'Your weekly knowledge digest contains 12 new items',
    timestamp: '1 day ago',
    read: true,
    actionUrl: '/analytics'
  },
  {
    id: '5',
    type: 'mention',
    title: 'David Kim mentioned you',
    message: 'in "Security Audit Findings"',
    timestamp: '2 days ago',
    read: true,
    sender: 'David Kim',
    actionUrl: '/knowledge/4'
  }
];

export function NotificationsPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  
  const [notifications, setNotifications] = useState(sampleNotifications);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const unreadCount = notifications.filter(n => !n.read).length;
  
  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.read;
    return true;
  });

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    toast({
      title: "All notifications marked as read",
      description: `${unreadCount} notifications marked as read.`,
      variant: "success"
    });
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    toast({
      title: "Notification deleted",
      description: "The notification has been removed.",
      variant: "success"
    });
  };

  const clearAll = () => {
    setNotifications([]);
    toast({
      title: "All notifications cleared",
      description: "All notifications have been removed.",
      variant: "success"
    });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'mention': return MessageSquare;
      case 'knowledge': return Archive;
      case 'team': return Users;
      case 'system': return Bell;
      default: return Bell;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'mention': return 'text-blue-600';
      case 'knowledge': return 'text-green-600';
      case 'team': return 'text-purple-600';
      case 'system': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <ArkivameLogo size="sm" />
            <div className="hidden md:block">
              <h1 className="text-xl font-semibold">Notifications</h1>
              <p className="text-sm text-muted-foreground">
                Stay updated with your team&apos;s activity
              </p>
            </div>
          </div>
          <UserMenu />
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <h2 className="text-2xl font-bold">Notifications</h2>
            {unreadCount > 0 && (
              <Badge variant="secondary">
                {unreadCount} unread
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Mark all read
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={clearAll}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Clear all
            </Button>
          </div>
        </div>

        <Tabs value={filter} onValueChange={(value) => setFilter(value as 'all' | 'unread')}>
          <TabsList className="mb-6">
            <TabsTrigger value="all">All Notifications</TabsTrigger>
            <TabsTrigger value="unread">
              Unread 
              {unreadCount > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value={filter} className="space-y-4">
            {filteredNotifications.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
                  </h3>
                  <p className="text-muted-foreground text-center max-w-sm">
                    {filter === 'unread' 
                      ? 'All caught up! You have no unread notifications.'
                      : 'When you have notifications, they will appear here.'
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredNotifications.map((notification) => {
                const IconComponent = getNotificationIcon(notification.type);
                return (
                  <Card 
                    key={notification.id}
                    className={`transition-colors ${!notification.read ? 'bg-blue-50/50 border-blue-200' : ''}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-4">
                        <div className={`mt-1 ${getNotificationColor(notification.type)}`}>
                          <IconComponent className="h-5 w-5" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <p className="font-medium text-sm">
                              {notification.title}
                            </p>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-600 rounded-full" />
                            )}
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-2">
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{notification.timestamp}</span>
                            </div>
                            {notification.sender && (
                              <span>from {notification.sender}</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                              title="Mark as read"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          
                          {notification.actionUrl && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                markAsRead(notification.id);
                                toast({
                                  title: "Navigation",
                                  description: `This would navigate to ${notification.actionUrl}`,
                                });
                              }}
                            >
                              View
                            </Button>
                          )}
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteNotification(notification.id)}
                            title="Delete notification"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>
        </Tabs>

        {/* Notification Settings Quick Access */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg">Notification Settings</CardTitle>
            <CardDescription>
              Customize how you receive notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Manage your notification preferences</p>
                <p className="text-sm text-muted-foreground">
                  Control when and how you receive notifications
                </p>
              </div>
              <Button variant="outline" asChild>
                <a href="/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
