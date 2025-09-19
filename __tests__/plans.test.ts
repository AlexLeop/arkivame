import { PLANS, getPlanByPriceId } from '@/lib/stripe';

describe('Stripe Plans Logic', () => {
  // Salva o ambiente original para restaurá-lo depois
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    // Reseta os módulos para garantir que as variáveis de ambiente sejam lidas novamente
    jest.resetModules();
    // Cria uma cópia do ambiente para evitar modificar o original entre os testes
    process.env = { ...ORIGINAL_ENV };

    // Define as variáveis de ambiente mockadas para os testes
    process.env.STRIPE_STARTER_MONTHLY_PRICE_ID = 'price_starter_mock';
    process.env.STRIPE_BUSINESS_MONTHLY_PRICE_ID = 'price_business_mock';
    process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID = 'price_enterprise_mock';
  });

  afterAll(() => {
    // Restaura o ambiente original
    process.env = ORIGINAL_ENV;
  });

  describe('PLANS constant', () => {
    it('should have the correct structure for all plans', () => {
      // Recarrega o módulo para usar as variáveis de ambiente mockadas
      const { PLANS: reloadedPlans } = require('@/lib/stripe');

      expect(reloadedPlans).toHaveProperty('FREE');
      expect(reloadedPlans).toHaveProperty('STARTER');
      expect(reloadedPlans).toHaveProperty('BUSINESS');
      expect(reloadedPlans).toHaveProperty('ENTERPRISE');
    });

    it('should correctly load stripePriceId from environment variables', () => {
      const { PLANS: reloadedPlans } = require('@/lib/stripe');

      expect(reloadedPlans.STARTER.stripePriceId).toBe('price_starter_mock');
      expect(reloadedPlans.BUSINESS.stripePriceId).toBe('price_business_mock');
      expect(reloadedPlans.ENTERPRISE.stripePriceId).toBe('price_enterprise_mock');
      expect(reloadedPlans.FREE.stripePriceId).toBeNull();
    });

    it('should have correct limits and features for the FREE plan', () => {
      expect(PLANS.FREE.price).toBe(0);
      expect(PLANS.FREE.limits.users).toBe(5);
      expect(PLANS.FREE.limits.archives).toBe(50);
      expect(PLANS.FREE.features).toContain('Busca básica');
    });

    it('should have correct limits and features for the BUSINESS plan', () => {
      expect(PLANS.BUSINESS.price).toBe(59);
      expect(PLANS.BUSINESS.limits.users).toBe(-1); // unlimited
      expect(PLANS.BUSINESS.features).toContain('Suporte prioritário');
    });
  });

  describe('getPlanByPriceId', () => {
    it('should return the correct plan key for a given price ID', () => {
      const { getPlanByPriceId: reloadedGetPlan } = require('@/lib/stripe');
      expect(reloadedGetPlan('price_starter_mock')).toBe('STARTER');
      expect(reloadedGetPlan('price_business_mock')).toBe('BUSINESS');
    });

    it('should return null for an unknown or null price ID', () => {
      const { getPlanByPriceId: reloadedGetPlan } = require('@/lib/stripe');
      expect(reloadedGetPlan('price_unknown_mock')).toBeNull();
      expect(reloadedGetPlan(null)).toBeNull();
    });
  });
});