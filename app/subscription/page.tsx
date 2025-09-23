'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  CreditCard, 
  Calendar, 
  Users, 
  Database, 
  CheckCircle, 
  AlertCircle,
  ArrowUpCircle,
  ArrowDownCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface SubscriptionData {
  plan: {
    name: string;
    price: number;
    interval: 'month' | 'year';
    features: string[];
  };
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  usage: {
    users: { current: number; limit: number };
    storage: { current: number; limit: number };
    knowledgeItems: { current: number; limit: number };
  };
}

const PLANS = {
  starter: {
    name: 'Starter',
    price: 29,
    interval: 'month' as const,
    features: [
      'Até 5 usuários',
      '1GB de armazenamento',
      '100 itens de conhecimento',
      'Integrações básicas',
      'Suporte por email'
    ]
  },
  professional: {
    name: 'Professional',
    price: 99,
    interval: 'month' as const,
    features: [
      'Até 25 usuários',
      '10GB de armazenamento',
      '1000 itens de conhecimento',
      'Todas as integrações',
      'Suporte prioritário',
      'Analytics avançado'
    ]
  },
  enterprise: {
    name: 'Enterprise',
    price: 299,
    interval: 'month' as const,
    features: [
      'Usuários ilimitados',
      '100GB de armazenamento',
      'Itens de conhecimento ilimitados',
      'Integrações personalizadas',
      'Suporte dedicado',
      'SLA garantido'
    ]
  }
};

export default function SubscriptionPage() {
  const { data: session } = useSession();
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  const fetchSubscriptionData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/subscription');
      if (response.ok) {
        const data = await response.json();
        setSubscriptionData(data);
      } else {
        toast.error('Falha ao carregar os dados da assinatura.');
      }
    } catch (error) {
      console.error('Error fetching subscription data:', error);
      toast.error('Erro ao carregar dados da assinatura');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscriptionAction = async (action: string, payload?: any) => {
    setActionLoading(true);
    try {
      const response = await fetch('/api/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.portalUrl) {
          window.location.href = data.portalUrl;
        } else if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
        } else {
          await fetchSubscriptionData();
        }
        return true;
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Ocorreu um erro.');
        return false;
      }
    } catch (error) {
      console.error(`Error with action ${action}:`, error);
      toast.error('Ocorreu um erro de rede.');
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const handlePlanChange = async (newPlan: keyof typeof PLANS) => {
    await handleSubscriptionAction('change_plan', { plan: newPlan });
  };

  const handleCancelSubscription = async () => {
    const success = await handleSubscriptionAction('cancel');
    if (success) {
      toast.success('Assinatura cancelada. Continuará ativa até o final do período atual.');
    }
  };

  const handleReactivateSubscription = async () => {
    const success = await handleSubscriptionAction('reactivate');
    if (success) {
      toast.success('Assinatura reativada com sucesso!');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Ativa', variant: 'default' as const, icon: CheckCircle },
      canceled: { label: 'Cancelada', variant: 'destructive' as const, icon: AlertCircle },
      past_due: { label: 'Vencida', variant: 'destructive' as const, icon: AlertCircle },
      trialing: { label: 'Período de Teste', variant: 'secondary' as const, icon: CheckCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.canceled;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getUsagePercentage = (current: number, limit: number) => {
    if (limit === 0) return 0;
    return Math.min((current / limit) * 100, 100);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!subscriptionData) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Não foi possível carregar os dados da sua assinatura.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gerenciar Assinatura</h1>
        <p className="text-muted-foreground">
          Gerencie seu plano, uso e configurações de cobrança
        </p>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Plano Atual
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold">{subscriptionData.plan.name}</h3>
              <p className="text-muted-foreground">
                R$ {subscriptionData.plan.price}/{subscriptionData.plan.interval === 'month' ? 'mês' : 'ano'}
              </p>
            </div>
            {getStatusBadge(subscriptionData.status)}
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            Próxima cobrança: {formatDate(subscriptionData.currentPeriodEnd)}
          </div>

          {subscriptionData.cancelAtPeriodEnd && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                Sua assinatura será cancelada em {formatDate(subscriptionData.currentPeriodEnd)}
              </p>
            </div>
          )}

          <div className="flex gap-2">
            {!subscriptionData.cancelAtPeriodEnd ? (
              <Button 
                variant="outline" 
                onClick={handleCancelSubscription}
                disabled={actionLoading}
              >
                Cancelar Assinatura
              </Button>
            ) : (
              <Button 
                onClick={handleReactivateSubscription}
                disabled={actionLoading}
              >
                Reativar Assinatura
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Uso Atual
          </CardTitle>
          <CardDescription>
            Acompanhe o uso dos recursos do seu plano
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span className="text-sm font-medium">Usuários</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {subscriptionData.usage.users.current} / {subscriptionData.usage.users.limit}
                </span>
              </div>
              <Progress 
                value={getUsagePercentage(subscriptionData.usage.users.current, subscriptionData.usage.users.limit)} 
                className="h-2"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  <span className="text-sm font-medium">Armazenamento</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {subscriptionData.usage.storage.current}GB / {subscriptionData.usage.storage.limit}GB
                </span>
              </div>
              <Progress 
                value={getUsagePercentage(subscriptionData.usage.storage.current, subscriptionData.usage.storage.limit)} 
                className="h-2"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Itens de Conhecimento</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {subscriptionData.usage.knowledgeItems.current} / {subscriptionData.usage.knowledgeItems.limit}
                </span>
              </div>
              <Progress 
                value={getUsagePercentage(subscriptionData.usage.knowledgeItems.current, subscriptionData.usage.knowledgeItems.limit)} 
                className="h-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Plans */}
      <Card>
        <CardHeader>
          <CardTitle>Planos Disponíveis</CardTitle>
          <CardDescription>
            Altere seu plano a qualquer momento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            {Object.entries(PLANS).map(([key, plan]) => {
              const isCurrentPlan = plan.name === subscriptionData.plan.name;
              const isUpgrade = plan.price > subscriptionData.plan.price;
              const isDowngrade = plan.price < subscriptionData.plan.price;

              return (
                <Card key={key} className={isCurrentPlan ? 'border-primary' : ''}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {plan.name}
                      {isCurrentPlan && <Badge>Atual</Badge>}
                    </CardTitle>
                    <CardDescription>
                      R$ {plan.price}/{plan.interval === 'month' ? 'mês' : 'ano'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-2 text-sm">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    {!isCurrentPlan && (
                      <Button 
                        className="w-full"
                        variant={isUpgrade ? 'default' : 'outline'}
                        onClick={() => handlePlanChange(key as keyof typeof PLANS)}
                        disabled={actionLoading}
                      >
                        {isUpgrade && <ArrowUpCircle className="h-4 w-4 mr-2" />}
                        {isDowngrade && <ArrowDownCircle className="h-4 w-4 mr-2" />}
                        {isUpgrade ? 'Fazer Upgrade' : 'Fazer Downgrade'}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}