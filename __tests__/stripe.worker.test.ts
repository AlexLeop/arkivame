import {
  handleCheckoutSessionCompleted,
  handleInvoicePaymentSucceeded,
  handleSubscriptionChange,
} from '@/lib/stripe-handlers';
import { prisma } from '@/lib/db';
import { stripe, getPlanByPriceId } from '@/lib/stripe';
import { redisConnection } from '@/lib/queues/redis/redis.connection';
import Stripe from 'stripe';

// Mock dependencies
jest.mock('@/lib/db', () => ({
  prisma: {
    organization: {
      update: jest.fn(),
    },
    subscription: {
      update: jest.fn(),
    },
  },
}));

jest.mock('@/lib/stripe', () => ({
  stripe: {
    subscriptions: {
      retrieve: jest.fn(),
    },
  },
  getPlanByPriceId: jest.fn(priceId => {
    if (priceId === 'price_starter') return 'STARTER';
    if (priceId === 'price_business') return 'BUSINESS';
    return null;
  }),
}));

jest.mock('@/lib/queues/redis.connection', () => ({
  redisConnection: {
    get: jest.fn(),
    set: jest.fn(),
  },
}));

// Type assertion for mocked functions
const mockedPrismaOrgUpdate = prisma.organization.update as jest.Mock;
const mockedPrismaSubUpdate = prisma.subscription.update as jest.Mock;
const mockedStripeSubRetrieve = stripe.subscriptions.retrieve as jest.Mock;
const mockedRedisGet = redisConnection.get as jest.Mock;
const mockedRedisSet = redisConnection.set as jest.Mock;

describe('Stripe Webhook Handlers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handleCheckoutSessionCompleted', () => {
    const mockSession: Partial<Stripe.Checkout.Session> = {
      id: 'cs_test_123',
      object: 'checkout.session',
      subscription: 'sub_123',
      metadata: {
        organizationId: 'org_123',
      },
    };

    const mockSubscription: Partial<Stripe.Subscription> & {
      current_period_end: number;
    } = {
      id: 'sub_123',
      customer: 'cus_123',
      status: 'active',
      items: {
        object: 'list',
        data: [
          {
            id: 'si_123',
            price: { id: 'price_starter', object: 'price', active: true } as Stripe.Price,
          } as Stripe.SubscriptionItem,
        ],
        has_more: false,
        url: '/v1/subscription_items?subscription=sub_123',
      },
      current_period_end: 1672531199, // Dec 31, 2022
    };

    it('should create a new subscription from fresh data if not cached', async () => {
      // Arrange
      mockedRedisGet.mockResolvedValue(null); // Cache miss
      mockedStripeSubRetrieve.mockResolvedValue(mockSubscription);
      mockedPrismaOrgUpdate.mockResolvedValue({});

      // Act
      await handleCheckoutSessionCompleted(mockSession as Stripe.Checkout.Session);

      // Assert
      expect(mockedRedisGet).toHaveBeenCalledWith('subscription:cache:sub_123');
      expect(mockedStripeSubRetrieve).toHaveBeenCalledWith('sub_123');
      expect(mockedRedisSet).toHaveBeenCalledWith(
        'subscription:cache:sub_123',
        JSON.stringify(mockSubscription),
        'EX',
        300,
      );
      expect(mockedPrismaOrgUpdate).toHaveBeenCalledWith({
        where: { id: 'org_123' },
        data: expect.objectContaining({ plan: 'STARTER' }),
      });
    });

    it('should create a new subscription from cached data', async () => {
      // Arrange
      mockedRedisGet.mockResolvedValue(JSON.stringify(mockSubscription)); // Cache hit
      mockedPrismaOrgUpdate.mockResolvedValue({});

      // Act
      await handleCheckoutSessionCompleted(mockSession as Stripe.Checkout.Session);

      // Assert
      expect(mockedRedisGet).toHaveBeenCalledWith('subscription:cache:sub_123');
      expect(mockedStripeSubRetrieve).not.toHaveBeenCalled();
      expect(mockedRedisSet).not.toHaveBeenCalled();
      expect(mockedPrismaOrgUpdate).toHaveBeenCalledWith({
        where: { id: 'org_123' },
        data: expect.objectContaining({ plan: 'STARTER' }),
      });
    });
  });

  describe('handleInvoicePaymentSucceeded', () => {
    it('should renew the subscription', async () => {
      // Arrange
      const mockInvoice: Partial<Stripe.Invoice> & { subscription: string } = {
        id: 'in_123',
        object: 'invoice',
        subscription: 'sub_xyz',
        period_end: 1675209599, // Jan 31, 2023
      };
      mockedPrismaSubUpdate.mockResolvedValue({});

      // Act
      await handleInvoicePaymentSucceeded(mockInvoice as Stripe.Invoice);

      // Assert
      expect(mockedPrismaSubUpdate).toHaveBeenCalledWith({
        where: { stripeSubscriptionId: 'sub_xyz' },
        data: {
          stripeCurrentPeriodEnd: new Date(1675209599 * 1000),
        },
      });
    });
  });

  describe('handleSubscriptionChange', () => {
    it('should handle subscription update', async () => {
      // Arrange
      const mockSubscription: Partial<Stripe.Subscription> & {
        current_period_end: number;
      } = {
        id: 'sub_abc',
        status: 'active',
        items: {
          data: [{ price: { id: 'price_business' } } as Stripe.SubscriptionItem],
        } as any,
        current_period_end: 1677628799,
      };
      mockedPrismaSubUpdate.mockResolvedValue({ organizationId: 'org_456' });
      mockedPrismaOrgUpdate.mockResolvedValue({});

      // Act
      await handleSubscriptionChange(mockSubscription as any, false);

      // Assert
      expect(mockedPrismaSubUpdate).toHaveBeenCalledWith({
        where: { stripeSubscriptionId: 'sub_abc' },
        data: expect.objectContaining({ plan: 'BUSINESS' }),
      });
      expect(mockedPrismaOrgUpdate).toHaveBeenCalledWith({
        where: { id: 'org_456' },
        data: { plan: 'BUSINESS' },
      });
    });

    it('should handle subscription deletion', async () => {
      // Arrange
      const mockSubscription: Partial<Stripe.Subscription> = {
        id: 'sub_def',
        status: 'canceled',
        canceled_at: 1672531200,
      };
      mockedPrismaSubUpdate.mockResolvedValue({ organizationId: 'org_789' });
      mockedPrismaOrgUpdate.mockResolvedValue({});

      // Act
      await handleSubscriptionChange(mockSubscription as any, true);

      // Assert
      expect(mockedPrismaSubUpdate).toHaveBeenCalledWith({
        where: { stripeSubscriptionId: 'sub_def' },
        data: {
          status: 'CANCELED',
          canceledAt: new Date(1672531200 * 1000),
        },
      });
      expect(mockedPrismaOrgUpdate).toHaveBeenCalledWith({
        where: { id: 'org_789' },
        data: { plan: 'FREE' },
      });
    });
  });
});