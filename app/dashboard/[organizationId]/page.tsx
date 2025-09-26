
import { MetricCard } from '@/components/dashboard/metric-card';
import { UsageChart } from '@/components/dashboard/usage-chart';
import { SourceBreakdownPieChart } from '@/components/dashboard/source-breakdown-pie-chart';
import { TopTagsList } from '@/components/dashboard/top-tags-list';
import { RecentActivityFeed } from '@/components/dashboard/recent-activity-feed';
import { Eye, Tag, Users, BarChart } from 'lucide-react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

async function getAnalyticsData(organizationId: string) {
  const session = await getServerSession(authOptions);
  if (!session) {
    console.error('No session found');
    return null;
  }

  // Esta função agora faria a chamada para a API interna
  // Como estamos no mesmo app, podemos chamar a lógica diretamente
  // mas para seguir o padrão, vamos simular a chamada de API.
  const response = await fetch(`${process.env.NEXTAUTH_URL}/api/analytics`);

  if (!response.ok) {
    // Tratar erro, talvez retornar dados vazios ou um estado de erro
    console.error("Failed to fetch analytics data");
    return null;
  }

  return response.json();
}

export default async function OrganizationDashboardPage({ params }: { params: { organizationId: string } }) {
  const data = await getAnalyticsData(params.organizationId);

  if (!data) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold">Erro ao carregar os dados</h2>
        <p className="text-muted-foreground">Não foi possível carregar os dados de analytics. Tente novamente mais tarde.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Total de Conhecimento" value={data.overview.totalKnowledge} icon={<BarChart className="h-4 w-4 text-muted-foreground" />} />
        <MetricCard title="Total de Tags" value={data.overview.totalTags} icon={<Tag className="h-4 w-4 text-muted-foreground" />} />
        <MetricCard title="Usuários Ativos" value={data.overview.activeUsers} icon={<Users className="h-4 w-4 text-muted-foreground" />} />
        <MetricCard title="Visualizações Mensais" value={data.overview.monthlyViews} icon={<Eye className="h-4 w-4 text-muted-foreground" />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <UsageChart data={data.usage} />
        <SourceBreakdownPieChart data={data.sourceBreakdown} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <TopTagsList data={data.topTags} />
        <RecentActivityFeed data={data.recentActivity} />
      </div>
    </div>
  );
}
