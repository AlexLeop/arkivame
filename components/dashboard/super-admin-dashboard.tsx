
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { 
  Users, 
  Building2, 
  Database, 
  TrendingUp, 
  AlertCircle, 
  Settings,
  BarChart3,
  Activity,
  Calendar,
  Search,
  Plus,
  Edit,
  Trash2,
  ExternalLink,
  DollarSign,
  Target,
  Heart
} from 'lucide-react';
import { ArkivameLogo } from '@/components/ui/arkivame-logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { UserMenu } from '@/components/shared/user-menu';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AddOrganizationModal } from '@/components/modals/add-organization-modal';
import { DeleteConfirmationModal } from '@/components/modals/delete-confirmation-modal';
import { GrowthChart, SourceChart } from '@/components/charts/analytics-charts';
import { 
  KeyMetricsCards,
  RevenueMetricsChart,
  MRRBreakdownChart,
  RetentionMetricsChart,
  AcquisitionMetricsChart,
  CacLtvChart,
  EngagementMetricsChart,
  StickinessChart,
  PlanDistributionChart
} from '@/components/charts/saas-metrics-charts';

interface Organization {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  plan: 'FREE' | 'STARTER' | 'BUSINESS' | 'ENTERPRISE';
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING' | 'CANCELLED';
  userCount: number;
  knowledgeCount: number;
  createdAt: string;
}

interface SystemStats {
  totalOrganizations: number;
  activeUsers: number;
  totalKnowledge: number;
  monthlyGrowth: number;
}

interface SaasMetrics {
  revenue: {
    mrr: number;
    arr: number;
    arpa: number;
    clv: number;
    ruleOf40: number;
  };
  acquisition: {
    cac: number;
    lvr: number;
    activationRate: number;
  };
  retention: {
    customerChurnRate: number;
    netDollarRetention: number;
    grossDollarRetention: number;
  };
  engagement: {
    dauMauRatio: number;
    stickinessRate: number;
    featureAdoptionRate: number;
  };
  satisfaction: {
    nps: number;
    csat: number;
    ces: number;
  };
}

export function SuperAdminDashboard() {
  const { data: session } = useSession();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [stats, setStats] = useState<SystemStats>({
    totalOrganizations: 0,
    activeUsers: 0,
    totalKnowledge: 0,
    monthlyGrowth: 0
  });
  const [saasMetrics, setSaasMetrics] = useState<SaasMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{
    show: boolean;
    organization: Organization | null;
  }>({ show: false, organization: null });

  const fetchData = useCallback(async () => {
    try {
      // Fetch organizations
      const orgsResponse = await fetch('/api/super-admin/organizations');
      if (orgsResponse.ok) {
        const orgsData = await orgsResponse.json();
        setOrganizations(orgsData.organizations || []);
      }

      // Fetch analytics  
      const analyticsResponse = await fetch('/api/super-admin/analytics');
      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json();
        setStats(analyticsData.overview || stats);
      }

      // Fetch SaaS metrics
      const metricsResponse = await fetch('/api/super-admin/metrics');
      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        setSaasMetrics({
          revenue: metricsData.revenue,
          acquisition: metricsData.acquisition,
          retention: metricsData.retention,
          engagement: metricsData.engagement,
          satisfaction: metricsData.satisfaction
        });
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }, [stats]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredOrganizations = organizations.filter(org =>
    org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    org.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'default';
      case 'PENDING': return 'secondary';
      case 'SUSPENDED': return 'destructive';
      case 'CANCELLED': return 'outline';
      default: return 'outline';
    }
  };

  const getPlanBadgeVariant = (plan: string) => {
    switch (plan) {
      case 'ENTERPRISE': return 'default';
      case 'BUSINESS': return 'default';
      case 'STARTER': return 'secondary';
      case 'FREE': return 'outline';
      default: return 'outline';
    }
  };

  const handleAddOrganization = (newOrganization: Organization) => {
    setOrganizations(prev => [newOrganization, ...prev]);
    setStats(prev => ({
      ...prev,
      totalOrganizations: prev.totalOrganizations + 1
    }));
  };

  const handleDeleteOrganization = async () => {
    if (!deleteModal.organization) return;
    
    try {
      // In a real app, make API call to delete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setOrganizations(prev => 
        prev.filter(org => org.id !== deleteModal.organization!.id)
      );
      
      setStats(prev => ({
        ...prev,
        totalOrganizations: prev.totalOrganizations - 1
      }));

      setDeleteModal({ show: false, organization: null });
    } catch (error) {
      console.error('Failed to delete organization:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p>Loading Super Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <ArkivameLogo size="sm" />
            <div className="hidden md:block">
              <h1 className="text-xl font-semibold">Super Admin</h1>
              <p className="text-sm text-muted-foreground">System Administration</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="hidden md:flex">
              <Activity className="mr-1 h-3 w-3" />
              {stats.totalOrganizations} Organizations
            </Badge>
            <UserMenu />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Organizations</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrganizations}</div>
              <p className="text-xs text-muted-foreground">
                +{stats.monthlyGrowth}% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeUsers}</div>
              <p className="text-xs text-muted-foreground">
                Across all organizations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Knowledge Items</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalKnowledge}</div>
              <p className="text-xs text-muted-foreground">
                Total captured conversations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Health</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">99.9%</div>
              <p className="text-xs text-muted-foreground">
                Uptime this month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="metrics" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="metrics">SaaS Metrics</TabsTrigger>
            <TabsTrigger value="organizations">Organizations</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="audit">Audit Logs</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="metrics" className="space-y-6">
            {saasMetrics && (
              <>
                {/* Key Metrics Cards */}
                <KeyMetricsCards 
                  metrics={{
                    mrr: saasMetrics.revenue.mrr,
                    arr: saasMetrics.revenue.arr,
                    customerChurn: saasMetrics.retention.customerChurnRate,
                    netRetention: saasMetrics.retention.netDollarRetention,
                    cac: saasMetrics.acquisition.cac,
                    ltv: saasMetrics.revenue.clv,
                    ruleOf40: saasMetrics.revenue.ruleOf40
                  }}
                />

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <RevenueMetricsChart data={[
                    { month: 'Jan', mrr: 5000, arr: 60000, newMrr: 1000, churnMrr: 200 },
                    { month: 'Feb', mrr: 5800, arr: 69600, newMrr: 1200, churnMrr: 400 },
                    { month: 'Mar', mrr: 6500, arr: 78000, newMrr: 1100, churnMrr: 400 },
                    { month: 'Apr', mrr: 7200, arr: 86400, newMrr: 1300, churnMrr: 600 },
                    { month: 'May', mrr: 8000, arr: 96000, newMrr: 1400, churnMrr: 600 },
                    { month: 'Jun', mrr: saasMetrics.revenue.mrr, arr: saasMetrics.revenue.arr, newMrr: 1500, churnMrr: 700 }
                  ]} />

                  <RetentionMetricsChart data={[
                    { month: 'Jan', customerChurn: 5, revenueChurn: 4, netRetention: 105 },
                    { month: 'Feb', customerChurn: 6, revenueChurn: 5, netRetention: 108 },
                    { month: 'Mar', customerChurn: 4, revenueChurn: 3, netRetention: 112 },
                    { month: 'Apr', customerChurn: 5, revenueChurn: 4, netRetention: 110 },
                    { month: 'May', customerChurn: 3, revenueChurn: 2, netRetention: 115 },
                    { month: 'Jun', customerChurn: saasMetrics.retention.customerChurnRate, revenueChurn: 3, netRetention: saasMetrics.retention.netDollarRetention }
                  ]} />

                  <AcquisitionMetricsChart data={[
                    { month: 'Jan', newCustomers: 12, cac: 180, ltv: 2400 },
                    { month: 'Feb', newCustomers: 15, cac: 170, ltv: 2500 },
                    { month: 'Mar', newCustomers: 18, cac: 160, ltv: 2600 },
                    { month: 'Apr', newCustomers: 22, cac: 155, ltv: 2700 },
                    { month: 'May', newCustomers: 25, cac: 150, ltv: 2800 },
                    { month: 'Jun', newCustomers: 28, cac: saasMetrics.acquisition.cac, ltv: saasMetrics.revenue.clv }
                  ]} />

                  <EngagementMetricsChart data={[
                    { month: 'Jan', dau: 120, mau: 450, dauMauRatio: 26.7 },
                    { month: 'Feb', dau: 135, mau: 480, dauMauRatio: 28.1 },
                    { month: 'Mar', dau: 150, mau: 520, dauMauRatio: 28.8 },
                    { month: 'Apr', dau: 165, mau: 550, dauMauRatio: 30.0 },
                    { month: 'May', dau: 180, mau: 600, dauMauRatio: 30.0 },
                    { month: 'Jun', dau: 195, mau: 650, dauMauRatio: saasMetrics.engagement.dauMauRatio }
                  ]} />
                </div>

                {/* Additional Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Heart className="h-5 w-5" />
                        Customer Satisfaction
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">NPS Score</span>
                        <Badge variant={saasMetrics.satisfaction.nps > 50 ? "default" : "secondary"}>
                          {saasMetrics.satisfaction.nps}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">CSAT</span>
                        <span className="text-sm text-muted-foreground">{saasMetrics.satisfaction.csat}/5</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">CES</span>
                        <span className="text-sm text-muted-foreground">{saasMetrics.satisfaction.ces}/5</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        Acquisition Efficiency
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">LVR</span>
                        <span className="text-sm text-muted-foreground">{saasMetrics.acquisition.lvr}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Activation Rate</span>
                        <span className="text-sm text-muted-foreground">{(saasMetrics.acquisition.activationRate * 100).toFixed(0)}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">CAC Payback</span>
                        <span className="text-sm text-muted-foreground">12 months</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Revenue Health
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">ARPA</span>
                        <span className="text-sm text-muted-foreground">${saasMetrics.revenue.arpa.toFixed(0)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Gross Retention</span>
                        <span className="text-sm text-muted-foreground">{saasMetrics.retention.grossDollarRetention.toFixed(0)}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Rule of 40</span>
                        <Badge variant={(saasMetrics.revenue.ruleOf40 * 100) > 40 ? "default" : "secondary"}>
                          {(saasMetrics.revenue.ruleOf40 * 100).toFixed(0)}%
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="organizations" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Organization Management</CardTitle>
                    <CardDescription>
                      Manage all organizations and their settings
                    </CardDescription>
                  </div>
                  <Button onClick={() => setShowAddModal(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Organization
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search organizations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="max-w-sm"
                  />
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Organization</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Users</TableHead>
                      <TableHead>Knowledge</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrganizations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          {searchQuery ? 'No organizations match your search.' : 'No organizations found.'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredOrganizations.map((org) => (
                        <TableRow key={org.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{org.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {org.slug}.arkivame.com
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getPlanBadgeVariant(org.plan)}>
                              {org.plan}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(org.status)}>
                              {org.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{org.userCount}</TableCell>
                          <TableCell>{org.knowledgeCount}</TableCell>
                          <TableCell>{new Date(org.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button variant="ghost" size="sm" title="Edit organization">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                title="View organization"
                                onClick={() => {
                                  window.open(`https://${org.slug}.localhost:3000`, '_blank');
                                }}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                title="Delete organization"
                                onClick={() => setDeleteModal({ show: true, organization: org })}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Usage Trends</CardTitle>
                  <CardDescription>System usage over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <GrowthChart data={[
                    { month: 'Jan', count: 2 },
                    { month: 'Feb', count: 3 },
                    { month: 'Mar', count: 4 },
                    { month: 'Apr', count: 4 },
                    { month: 'May', count: 5 },
                    { month: 'Jun', count: 5 }
                  ]} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Growth Metrics</CardTitle>
                  <CardDescription>Platform growth indicators</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">New Organizations</span>
                      <span className="text-sm text-muted-foreground">+12 this month</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Active Users Growth</span>
                      <span className="text-sm text-muted-foreground">+23% MoM</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Knowledge Captured</span>
                      <span className="text-sm text-muted-foreground">+456 items</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">System Performance</span>
                      <span className="text-sm text-green-600">Excellent</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="audit" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>System Audit Logs</CardTitle>
                <CardDescription>Recent system activities and changes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { time: '2 minutes ago', user: 'System', action: 'Database backup completed', type: 'success' },
                    { time: '1 hour ago', user: 'admin@arkivame.com', action: 'Created new organization: TechCorp', type: 'info' },
                    { time: '3 hours ago', user: 'System', action: 'Security scan completed', type: 'success' },
                    { time: '1 day ago', user: 'admin@arkivame.com', action: 'Updated system configuration', type: 'warning' }
                  ].map((log, index) => (
                    <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
                      <div className={`w-2 h-2 rounded-full ${
                        log.type === 'success' ? 'bg-green-500' : 
                        log.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                      }`} />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{log.action}</p>
                        <p className="text-xs text-muted-foreground">by {log.user}</p>
                      </div>
                      <div className="text-xs text-muted-foreground">{log.time}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Configuration</CardTitle>
                  <CardDescription>Core system settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Maintenance Mode</p>
                      <p className="text-sm text-muted-foreground">Enable system maintenance</p>
                    </div>
                    <Button variant="outline" size="sm">Configure</Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Backup Schedule</p>
                      <p className="text-sm text-muted-foreground">Automatic daily backups</p>
                    </div>
                    <Button variant="outline" size="sm">Configure</Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Security Settings</p>
                      <p className="text-sm text-muted-foreground">Access control and encryption</p>
                    </div>
                    <Button variant="outline" size="sm">Configure</Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Status</CardTitle>
                  <CardDescription>Current system health</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Database</span>
                    <Badge variant="default">Healthy</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Redis Cache</span>
                    <Badge variant="default">Online</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Search Index</span>
                    <Badge variant="default">Operational</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Storage</span>
                    <Badge variant="default">Available</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      <AddOrganizationModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onOrganizationAdded={handleAddOrganization}
      />

      <DeleteConfirmationModal
        open={deleteModal.show}
        onOpenChange={(open) => setDeleteModal({ show: open, organization: null })}
        title="Delete Organization"
        description={`Are you sure you want to delete "${deleteModal.organization?.name}"? This action cannot be undone and will permanently remove all data associated with this organization.`}
        confirmText="Delete Organization"
        onConfirm={handleDeleteOrganization}
      />
    </div>
  );
}
