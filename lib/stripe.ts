
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-08-27.basil',
});

export const PLANS = {
  FREE: {
    name: 'Free',
    price: 0,
    stripePriceId: null,
    limits: {
      users: 5,
      archives: 50,
      integrations: 1,
      storage: 1, // GB
    },
    features: [
      'Até 5 usuários',
      'Até 50 arquivamentos/mês',
      'Acesso ao Core MVP',
      'Busca básica',
      '1 integração'
    ]
  },
  STARTER: {
    name: 'Starter',
    price: 29,
    stripePriceId: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID,
    limits: {
      users: 25,
      archives: 200,
      integrations: 5,
      storage: 10, // GB
    },
    features: [
      'Até 25 usuários',
      'Até 200 arquivamentos/mês',
      'Core MVP + Integração de Saída',
      'Busca avançada',
      '5 integrações',
      'Analytics básico'
    ]
  },
  BUSINESS: {
    name: 'Business',
    price: 59,
    stripePriceId: process.env.STRIPE_BUSINESS_MONTHLY_PRICE_ID,
    limits: {
      users: -1, // unlimited
      archives: -1, // unlimited
      integrations: -1, // unlimited
      storage: 100, // GB
    },
    features: [
      'Usuários ilimitados',
      'Arquivamentos ilimitados',
      'Todas as funcionalidades',
      'Bot proativo',
      'Analytics avançado',
      'Integrações ilimitadas',
      'Suporte prioritário',
      'API personalizada'
    ]
  },
  ENTERPRISE: {
    name: 'Enterprise',
    price: 199,
    stripePriceId: process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID,
    limits: {
      users: -1, // unlimited
      archives: -1, // unlimited
      integrations: -1, // unlimited
      storage: 1000, // GB
    },
    features: [
      'Tudo do Business',
      'SLA garantido',
      'Suporte dedicado',
      'Deployment on-premise',
      'SSO personalizado',
      'Auditoria completa'
    ]
  }
};

export async function createStripeCustomer(email: string, name: string) {
  return await stripe.customers.create({
    email,
    name,
  });
}

export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string
) {
  return await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
  });
}

export async function createBillingPortalSession(customerId: string, returnUrl: string) {
  return await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
}

export async function getSubscriptionStatus(subscriptionId: string) {
  return await stripe.subscriptions.retrieve(subscriptionId);
}

/**
 * Retorna a chave do plano (ex: 'STARTER') com base no ID de preço do Stripe.
 * @param priceId O ID de preço do Stripe.
 * @returns A chave do plano ou null se não for encontrado.
 */
export function getPlanByPriceId(priceId: string | null): string | null {
  if (!priceId) return null;
  const planEntry = Object.entries(PLANS).find(([, plan]) => plan.stripePriceId === priceId);
  return planEntry ? planEntry[0] : null;
}
