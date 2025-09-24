'use client';

import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, DollarSign, Users, Target, Heart } from 'lucide-react';

// Interfaces para os dados das métricas
interface RevenueData {
  month: string;
  mrr: number;
  arr: number;
  newMrr: number;
  churnMrr: number;
}

interface ChurnData {
  month: string;
  customerChurn: number;
  revenueChurn: number;
  netRetention: number;
}

interface AcquisitionData {
  month: string;
  newCustomers: number;
  cac: number;
  ltv: number;
}

interface EngagementData {
  month: string;
  dau: number;
  mau: number;
  dauMauRatio: number;
}

// Componente para métricas de receita
export function RevenueMetricsChart({ data }: { data: RevenueData[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Revenue Metrics
        </CardTitle>
        <CardDescription>MRR, ARR and revenue breakdown over time</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value) => [`$${value}`, '']} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="mrr" 
              stroke="#8884d8" 
              strokeWidth={2}
              name="MRR"
            />
            <Line 
              type="monotone" 
              dataKey="arr" 
              stroke="#82ca9d" 
              strokeWidth={2}
              name="ARR"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Componente para breakdown do MRR
export function MRRBreakdownChart({ data }: { data: RevenueData[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>MRR Breakdown</CardTitle>
        <CardDescription>New MRR vs Churned MRR</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value) => [`$${value}`, '']} />
            <Legend />
            <Bar dataKey="newMrr" fill="#10b981" name="New MRR" />
            <Bar dataKey="churnMrr" fill="#ef4444" name="Churned MRR" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Componente para métricas de churn e retenção
export function RetentionMetricsChart({ data }: { data: ChurnData[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5" />
          Retention & Churn
        </CardTitle>
        <CardDescription>Customer and revenue retention metrics</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value, name) => [
              name === 'netRetention' ? `${value}%` : `${value}%`,
              name
            ]} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="customerChurn" 
              stroke="#ef4444" 
              strokeWidth={2}
              name="Customer Churn %"
            />
            <Line 
              type="monotone" 
              dataKey="revenueChurn" 
              stroke="#f59e0b" 
              strokeWidth={2}
              name="Revenue Churn %"
            />
            <Line 
              type="monotone" 
              dataKey="netRetention" 
              stroke="#10b981" 
              strokeWidth={2}
              name="Net Retention %"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Componente para métricas de aquisição
export function AcquisitionMetricsChart({ data }: { data: AcquisitionData[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Customer Acquisition
        </CardTitle>
        <CardDescription>New customers, CAC and LTV trends</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="newCustomers" 
              stackId="1"
              stroke="#8884d8" 
              fill="#8884d8" 
              name="New Customers"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Componente para CAC vs LTV
export function CacLtvChart({ data }: { data: AcquisitionData[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>CAC vs LTV</CardTitle>
        <CardDescription>Customer acquisition cost vs lifetime value</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value) => [`$${value}`, '']} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="cac" 
              stroke="#ef4444" 
              strokeWidth={2}
              name="CAC"
            />
            <Line 
              type="monotone" 
              dataKey="ltv" 
              stroke="#10b981" 
              strokeWidth={2}
              name="LTV"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Componente para métricas de engajamento
export function EngagementMetricsChart({ data }: { data: EngagementData[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          User Engagement
        </CardTitle>
        <CardDescription>Daily and monthly active users</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="dau" 
              stroke="#8884d8" 
              strokeWidth={2}
              name="DAU"
            />
            <Line 
              type="monotone" 
              dataKey="mau" 
              stroke="#82ca9d" 
              strokeWidth={2}
              name="MAU"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Componente para DAU/MAU ratio
export function StickinessChart({ data }: { data: EngagementData[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>User Stickiness</CardTitle>
        <CardDescription>DAU/MAU ratio over time</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value) => [`${value}%`, 'Stickiness']} />
            <Area 
              type="monotone" 
              dataKey="dauMauRatio" 
              stroke="#8884d8" 
              fill="#8884d8" 
              fillOpacity={0.6}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Componente para distribuição de planos
export function PlanDistributionChart({ data }: { 
  data: Array<{ name: string; value: number; color: string }> 
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Plan Distribution</CardTitle>
        <CardDescription>Customer distribution across plans</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${((percent as number) * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Componente para KPIs principais
export function KeyMetricsCards({ metrics }: { 
  metrics: {
    mrr: number;
    arr: number;
    customerChurn: number;
    netRetention: number;
    cac: number;
    ltv: number;
    ruleOf40: number;
  }
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">MRR</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${metrics.mrr.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            Monthly Recurring Revenue
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">ARR</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${metrics.arr.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            Annual Recurring Revenue
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.customerChurn.toFixed(1)}%</div>
          <p className="text-xs text-muted-foreground">
            Monthly customer churn
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Net Retention</CardTitle>
          <Heart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.netRetention.toFixed(0)}%</div>
          <p className="text-xs text-muted-foreground">
            Net Dollar Retention
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">CAC</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${metrics.cac.toFixed(0)}</div>
          <p className="text-xs text-muted-foreground">
            Customer Acquisition Cost
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">LTV</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${metrics.ltv.toFixed(0)}</div>
          <p className="text-xs text-muted-foreground">
            Customer Lifetime Value
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Rule of 40</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{(metrics.ruleOf40 * 100).toFixed(0)}%</div>
          <p className="text-xs text-muted-foreground">
            Growth + Profit Margin
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">LTV:CAC Ratio</CardTitle>
          <Badge variant={metrics.ltv / metrics.cac > 3 ? "default" : "destructive"}>
            {(metrics.ltv / metrics.cac).toFixed(1)}:1
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {metrics.ltv / metrics.cac > 3 ? 'Healthy' : 'Needs Attention'}
          </div>
          <p className="text-xs text-muted-foreground">
            Target: 3:1 or higher
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

