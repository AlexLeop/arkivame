'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2, ExternalLink, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { UsageDashboard } from './usage-dashboard';
import Link from 'next/link';

interface SubscriptionDetails {
  planName: string;
  status: string;
  currentPeriodEnd: string | null;
}

interface PlanDetails {
  key: 'FREE' | 'STARTER' | 'BUSINESS' | 'ENTERPRISE';
  name: string;
  price: {
    monthly: number;
    yearly: number;
  };
  limits: any;
}

type BillingInterval = 'monthly' | 'yearly';

interface BillingSettingsProps {
  organizationId: string;
}

export function BillingSettings({ organizationId }: BillingSettingsProps) {
  const [subscription, setSubscription] = useState<SubscriptionDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isManaging, setIsManaging] = useState(false);
  const [isChangingPlan, setIsChangingPlan] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allPlans, setAllPlans] = useState<PlanDetails[]>([]);
  const [planToChange, setPlanToChange] = useState<{ plan: PlanDetails, interval: BillingInterval } | null>(null);

  const availablePlans = useMemo(() => {
    if (!subscription) return [];
    return allPlans.filter(p => p.name !== subscription.planName && p.key !== 'FREE');
  }, [allPlans, subscription]);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(null);
      try {
        const [subRes, plansRes] = await Promise.all([
          fetch(`/api/org/${organizationId}/billing/subscription`),
          fetch('/api/plans'),
        ]);

        if (!subRes.ok) throw new Error('Failed to fetch subscription details.');
        if (!plansRes.ok) throw new Error('Failed to fetch plans.');

        const subData = await subRes.json();
        setSubscription(subData);

        const plansData = await plansRes.json();
        const formattedPlans = Object.keys(plansData).map(key => ({
          key: key as PlanDetails['key'],
          ...plansData[key]
        }));
        setAllPlans(formattedPlans);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [organizationId]);

  const handleManageSubscription = async () => {
    setIsManaging(true);
    setError(null);
    try {
      const response = await fetch(`/api/org/${organizationId}/billing/customer-portal`, {
        method: 'POST',
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Could not open management portal.');
      }
      window.location.href = data.url;
    } catch (err: any) {
      setError(err.message);
      setIsManaging(false);
    }
  };

  const handleChangePlan = async () => {
    if (!planToChange) return;
    setIsChangingPlan(true);
    setError(null);
    try {
      const response = await fetch(`/api/org/${organizationId}/billing/subscription`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planToChange.plan.key, interval: planToChange.interval }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Could not change plan.');
      }
      // Recarrega a página para refletir as alterações. O webhook atualizará o BD.
      window.location.reload();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsChangingPlan(false);
      setPlanToChange(null);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-6 w-1/4" />
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-10 w-48 mt-4" />
        </div>
      );
    }

    if (error && !isChangingPlan) return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
    if (!subscription) return <p>No subscription information found.</p>;

    const isPaidPlan = subscription.planName !== 'Free';
    const renewalDate = subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : 'N/A';

    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold">Current Plan:</h3>
          <Badge variant="secondary" className="text-lg px-3 py-1">{subscription.planName}</Badge>
        </div>
        {isPaidPlan ? (
          <>
            <p className="text-muted-foreground">Status: <span className="font-medium capitalize text-foreground">{subscription.status.replace('_', ' ')}</span></p>
            <p className="text-muted-foreground">{subscription.status === 'canceled' ? 'Access ends on:' : 'Renews on:'} <span className="font-medium text-foreground">{renewalDate}</span></p>
            <Button onClick={handleManageSubscription} disabled={isManaging}>
              {isManaging && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Manage Subscription
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
            <p className="text-xs text-muted-foreground">You will be redirected to our payment partner, Stripe, to manage your subscription.</p>
          </>
        ) : (
          <div>
            <p className="text-muted-foreground mb-4">You are currently on the Free plan.</p>
            <Button asChild><Link href="/#pricing">Upgrade Plan</Link></Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <Card>
          <CardHeader>
            <CardTitle>Billing & Subscription</CardTitle>
            <CardDescription>View your current plan and manage your subscription details.</CardDescription>
          </CardHeader>
          <CardContent>{renderContent()}</CardContent>
        </Card>
        <UsageDashboard organizationId={organizationId} />
      </div>

      {availablePlans.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Change Plan</CardTitle>
            <CardDescription>Upgrade or downgrade your subscription.</CardDescription>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-6">
            {availablePlans.map(plan => (
              <Card key={plan.key} className="p-6 flex flex-col">
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <p className="text-muted-foreground mt-1 mb-4 flex-grow">{plan.price.monthly === -1 ? 'Custom pricing' : `$${plan.price.monthly}/month or $${plan.price.yearly}/year`}</p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setPlanToChange({ plan, interval: 'monthly' })}
                    disabled={isChangingPlan}
                  >
                    Switch (Monthly)
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setPlanToChange({ plan, interval: 'yearly' })}
                    disabled={isChangingPlan}
                  >
                    Switch (Yearly)
                  </Button>
                </div>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}

      <AlertDialog open={!!planToChange} onOpenChange={(open) => !open && setPlanToChange(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Plan Change</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to switch to the <strong>{planToChange?.plan.name}</strong> plan ({planToChange?.interval}). Your billing will be adjusted accordingly. Are you sure?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isChangingPlan}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleChangePlan} disabled={isChangingPlan}>
              {isChangingPlan && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm & Switch
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}