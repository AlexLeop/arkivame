'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Archive, Puzzle } from 'lucide-react';

interface UsageMetric {
  current: number;
  limit: number;
}

interface UsageData {
  plan: string;
  usage: {
    users: UsageMetric;
    archivements: UsageMetric;
    integrations: UsageMetric;
    storage: UsageMetric;
  };
}

interface UsageDashboardProps {
  organizationId: string;
}

function UsageBar({ icon: Icon, title, current, limit }: { icon: React.ElementType, title: string, current: number, limit: number }) {
  const isUnlimited = limit === -1;
  const percentage = isUnlimited ? 0 : Math.min((current / limit) * 100, 100);
  const displayLimit = isUnlimited ? 'Unlimited' : limit;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <div className="flex items-center text-sm font-medium">
          <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
          {title}
        </div>
        <div className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{current}</span> / {displayLimit}
        </div>
      </div>
      {!isUnlimited && <Progress value={percentage} />}
    </div>
  );
}

export function UsageDashboard({ organizationId }: UsageDashboardProps) {
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchUsage() {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/org/${organizationId}/billing/usage`);
        if (!response.ok) throw new Error('Failed to fetch usage data.');
        const data = await response.json();
        setUsageData(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchUsage();
  }, [organizationId]);

  if (isLoading) {
    return (
      <Card className="max-w-2xl">
        <CardHeader>
          <Skeleton className="h-7 w-1/3" />
          <Skeleton className="h-5 w-2/3" />
        </CardHeader>
        <CardContent className="space-y-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!usageData) return <p>Could not load usage data.</p>;

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Usage Dashboard</CardTitle>
        <CardDescription>Your current usage based on the {usageData.plan} plan.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <UsageBar icon={Users} title="Users" current={usageData.usage.users.current} limit={usageData.usage.users.limit} />
        <UsageBar icon={Archive} title="Archived Items" current={usageData.usage.archivements.current} limit={usageData.usage.archivements.limit} />
        <UsageBar icon={Puzzle} title="Integrations" current={usageData.usage.integrations.current} limit={usageData.usage.integrations.limit} />
      </CardContent>
    </Card>
  );
}