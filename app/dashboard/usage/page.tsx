'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Database, 
  FileText, 
  Activity, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Clock,
  Eye,
  MessageSquare
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface UsageData {
  overview: {
    users: { current: number; limit: number; growth: number };
    storage: { current: number; limit: number; growth: number };
    knowledgeItems: { current: number; limit: number; growth: number };
    apiCalls: { current: number; limit: number; growth: number };
  };
  trends: {
    daily: Array<{ date: string; users: number; storage: number; items: number }>;
    monthly: Array<{ month: string; users: number; storage: number; items: number }>;
  };
  activity: {
    topUsers: Array<{ name: string; email: string; items: number; views: number }>;
    topContent: Array<{ title: string; views: number; source: string; createdAt: string }>;
    integrations: Array<{ name: string; usage: number; status: 'active' | 'inactive' }>;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function UsageDashboard() {
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    fetchUsageData();
  }, [timeRange]);

  const fetchUsageData = async () => {
    try {
      setLoading(true);
      
      // Fetch real usage data from API
      const response = await fetch('/api/analytics/usage');
      
      if (response.ok) {
        const data = await response.json();
        setUsageData(data);
      } else {
        console.error('Failed to fetch usage data:', response.statusText);
        
        // Fallback to empty data structure
        setUsageData({
          overview: {
            users: { current: 0, limit: 25, growth: 0 },
            storage: { current: 0, limit: 10, growth: 0 },
            knowledgeItems: { current: 0, limit: 1000, growth: 0 },
            apiCalls: { current: 0, limit: 50000, growth: 0 }
          },
          trends: {
            daily: [],
            monthly: []
          },
          activity: {
            topUsers: [],
            topContent: [],
            integrations: []
          }
        });
      }
    } catch (error) {
      console.error('Error fetching usage data:', error);
      
      // Set empty data structure on error
      setUsageData({
        overview: {
          users: { current: 0, limit: 25, growth: 0 },
          storage: { current: 0, limit: 10, growth: 0 },
          knowledgeItems: { current: 0, limit: 1000, growth: 0 },
          apiCalls: { current: 0, limit: 50000, growth: 0 }
        },
        trends: {
          daily: [],
          monthly: []
        },
        activity: {
          topUsers: [],
          topContent: [],
          integrations: []
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const getUsagePercentage = (current: number, limit: number) => {
    return Math.min((current / limit) * 100, 100);
  };

  const formatGrowth = (growth: number) => {
    const isPositive = growth > 0;
    const Icon = isPositive ? TrendingUp : TrendingDown;
    const color = isPositive ? 'text-green-600' : 'text-red-600';
    
    return (
      <div className={`flex items-center gap-1 ${color}`}>
        <Icon className="h-3 w-3" />
        <span className="text-xs">{Math.abs(growth).toFixed(1)}%</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!usageData) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Erro ao carregar dados de uso
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard de Uso</h1>
        <p className="text-muted-foreground">
          Acompanhe o uso dos recursos e atividade da sua organização
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usageData.overview.users.current}</div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                de {usageData.overview.users.limit} usuários
              </p>
              {formatGrowth(usageData.overview.users.growth)}
            </div>
            <Progress 
              value={getUsagePercentage(usageData.overview.users.current, usageData.overview.users.limit)} 
              className="mt-2 h-1"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Armazenamento</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usageData.overview.storage.current}GB</div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                de {usageData.overview.storage.limit}GB
              </p>
              {formatGrowth(usageData.overview.storage.growth)}
            </div>
            <Progress 
              value={getUsagePercentage(usageData.overview.storage.current, usageData.overview.storage.limit)} 
              className="mt-2 h-1"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Itens de Conhecimento</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usageData.overview.knowledgeItems.current}</div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                de {usageData.overview.knowledgeItems.limit} itens
              </p>
              {formatGrowth(usageData.overview.knowledgeItems.growth)}
            </div>
            <Progress 
              value={getUsagePercentage(usageData.overview.knowledgeItems.current, usageData.overview.knowledgeItems.limit)} 
              className="mt-2 h-1"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chamadas API</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usageData.overview.apiCalls.current.toLocaleString()}</div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                de {usageData.overview.apiCalls.limit.toLocaleString()} chamadas
              </p>
              {formatGrowth(usageData.overview.apiCalls.growth)}
            </div>
            <Progress 
              value={getUsagePercentage(usageData.overview.apiCalls.current, usageData.overview.apiCalls.limit)} 
              className="mt-2 h-1"
            />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Tendências</TabsTrigger>
          <TabsTrigger value="activity">Atividade</TabsTrigger>
          <TabsTrigger value="integrations">Integrações</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tendências de Uso</CardTitle>
              <CardDescription>
                Acompanhe o crescimento dos recursos ao longo do tempo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={usageData.trends.monthly}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="users" stroke="#8884d8" name="Usuários" />
                  <Line type="monotone" dataKey="storage" stroke="#82ca9d" name="Armazenamento (GB)" />
                  <Line type="monotone" dataKey="items" stroke="#ffc658" name="Itens de Conhecimento" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Usuários Mais Ativos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {usageData.activity.topUsers.map((user, index) => (
                    <div key={user.email} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{user.items} itens</p>
                        <p className="text-xs text-muted-foreground">{user.views} visualizações</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Conteúdo Mais Visualizado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {usageData.activity.topContent.map((content, index) => (
                    <div key={content.title} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm truncate">{content.title}</p>
                        <Badge variant="outline">{content.source}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          {new Date(content.createdAt).toLocaleDateString('pt-BR')}
                        </p>
                        <p className="text-xs font-medium">{content.views} visualizações</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Uso das Integrações
              </CardTitle>
              <CardDescription>
                Veja como suas integrações estão sendo utilizadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {usageData.activity.integrations.map((integration) => (
                  <div key={integration.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        integration.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                      }`} />
                      <span className="font-medium">{integration.name}</span>
                      <Badge variant={integration.status === 'active' ? 'default' : 'secondary'}>
                        {integration.status === 'active' ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{integration.usage}% do uso</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

