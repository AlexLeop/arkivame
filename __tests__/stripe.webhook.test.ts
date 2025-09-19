import { POST } from '@/app/api/webhooks/stripe/route';
import { stripe } from '@/lib/stripe';
import logger from '@/lib/logger';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { stripeWebhookQueue } from '@/lib/queues/stripe/stripe.queue';

// Mock dependencies
const mockRatelimitLimit = jest.fn();
jest.mock('@upstash/ratelimit', () => ({
  Ratelimit: jest.fn().mockImplementation(() => ({
    limit: mockRatelimitLimit,
  })),
}));

// Mock dependencies
jest.mock('@/lib/stripe', () => ({
  stripe: {
    subscriptions: {
      retrieve: jest.fn(),
    },
    webhooks: {
      constructEvent: jest.fn(),
    },
  },
}));

jest.mock('next/headers', () => ({
  headers: jest.fn(() => ({
    get: jest.fn(header => {
      if (header === 'Stripe-Signature') {
        return 'mock_stripe_signature';
      }
      return null;
    }),
  })),
}));

jest.mock('@/lib/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

jest.mock('@/lib/queues/stripe/stripe.queue', () => ({
  stripeWebhookQueue: {
    add: jest.fn(),
  },
}));

// Type assertion for mocked functions
const mockedStripeWebhooksConstruct = stripe.webhooks.constructEvent as jest.Mock;
const mockedStripeQueueAdd = stripeWebhookQueue.add as jest.Mock;

describe('Stripe Webhook Handler (POST /api/webhooks/stripe)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.STRIPE_WEBHOOK_SECRET = 'test_webhook_secret';
    mockRatelimitLimit.mockResolvedValue({ success: true }); // Default to success
  });

  const createMockRequest = (body: string): Request => {
    return {
      text: () => Promise.resolve(body),
      headers: new Headers({
        'Stripe-Signature': 'mock_stripe_signature',
      }),
    } as Request;
  };

  it('should return 429 if rate limit is exceeded', async () => {
    // Arrange
    mockRatelimitLimit.mockResolvedValue({
      success: false,
      limit: 20,
      remaining: 0,
      reset: Date.now() + 10000,
    });
    const req = createMockRequest('{}');

    // Act
    const response = await POST(req);

    // Assert
    expect(response.status).toBe(429);
    expect(await response.text()).toBe('Rate limit exceeded');
    expect(mockedStripeWebhooksConstruct).not.toHaveBeenCalled();
  });

  it('should enqueue a checkout.session.completed event', async () => {
    // Arrange
    const mockSession: Partial<Stripe.Checkout.Session> = {
      id: 'cs_test_123',
      object: 'checkout.session',
      subscription: 'sub_123',
      metadata: {
        organizationId: 'org_123',
      },
    };

    const mockEvent: Partial<Stripe.Event> = {
      id: 'evt_123',
      type: 'checkout.session.completed',
      data: {
        object: mockSession as Stripe.Checkout.Session,
      },
    };

    mockedStripeWebhooksConstruct.mockReturnValue(mockEvent as Stripe.Event);

    const req = createMockRequest(JSON.stringify(mockEvent));

    // Act
    const response = await POST(req);

    // Assert
    expect(response.status).toBe(200);
    expect(mockedStripeQueueAdd).toHaveBeenCalledWith('checkout.session.completed', { event: mockEvent });
  });

  it('should enqueue an invoice.payment_succeeded event', async () => {
    // Arrange
    const mockInvoice: Partial<Stripe.Invoice> & { subscription: string } = {
      id: 'in_123',
      object: 'invoice',
      subscription: 'sub_xyz',
      period_end: 1675209599, // Jan 31, 2023
    };

    const mockEvent: Partial<Stripe.Event> = {
      id: 'evt_456',
      type: 'invoice.payment_succeeded',
      data: {
        object: mockInvoice as Stripe.Invoice,
      },
    };

    mockedStripeWebhooksConstruct.mockReturnValue(mockEvent as Stripe.Event);

    const req = createMockRequest(JSON.stringify(mockEvent));

    // Act
    const response = await POST(req);

    // Assert
    expect(response.status).toBe(200);
    expect(mockedStripeQueueAdd).toHaveBeenCalledWith('invoice.payment_succeeded', { event: mockEvent });
  });

  it('should enqueue a customer.subscription.updated event', async () => {
    // Arrange
    const mockSubscription: Partial<Stripe.Subscription> & {
      current_period_end: number;
    } = {
      id: 'sub_abc',
      status: 'active',
      items: {
        object: 'list',
        data: [
          {
            id: 'si_456',
            price: { id: 'price_business', object: 'price', active: true } as Stripe.Price,
          } as Stripe.SubscriptionItem,
        ],
        has_more: false,
        url: '/v1/subscription_items?subscription=sub_abc',
      },
      current_period_end: 1677628799, // Feb 28, 2023
    };

    const mockEvent: Partial<Stripe.Event> = {
      id: 'evt_789',
      type: 'customer.subscription.updated',
      data: {
        object: mockSubscription as Stripe.Subscription,
      },
    };

    mockedStripeWebhooksConstruct.mockReturnValue(mockEvent as Stripe.Event);

    const req = createMockRequest(JSON.stringify(mockEvent));

    // Act
    const response = await POST(req);

    // Assert
    expect(response.status).toBe(200);
    expect(mockedStripeQueueAdd).toHaveBeenCalledWith('customer.subscription.updated', { event: mockEvent });
  });

  it('should enqueue a customer.subscription.deleted event', async () => {
    // Arrange
    const mockSubscription: Partial<Stripe.Subscription> = {
      id: 'sub_def',
      status: 'canceled',
      canceled_at: 1672531200,
    };

    const mockEvent: Partial<Stripe.Event> = {
      id: 'evt_012',
      type: 'customer.subscription.deleted',
      data: {
        object: mockSubscription as Stripe.Subscription,
      },
    };

    mockedStripeWebhooksConstruct.mockReturnValue(mockEvent as Stripe.Event);

    const req = createMockRequest(JSON.stringify(mockEvent));

    // Act
    const response = await POST(req);

    // Assert
    expect(response.status).toBe(200);
    expect(mockedStripeQueueAdd).toHaveBeenCalledWith('customer.subscription.deleted', { event: mockEvent });
  });

  it('should return 400 for invalid signature', async () => {
    // Arrange
    const errorMessage = 'Invalid signature';
    mockedStripeWebhooksConstruct.mockImplementation(() => {
      throw new Error(errorMessage);
    });

    const req = createMockRequest('invalid body');

    // Act
    const response = await POST(req);
    const text = await response.text();

    // Assert
    expect(response.status).toBe(400);
    expect(text).toContain(errorMessage);
  });

  it('should return 500 if enqueuing fails', async () => {
    // Arrange
    const errorMessage = 'Failed to connect to Redis';
    const mockEvent: Partial<Stripe.Event> = {
      id: 'evt_err',
      type: 'invoice.payment_succeeded',
      data: { object: {} as Stripe.Invoice },
    };

    mockedStripeWebhooksConstruct.mockReturnValue(mockEvent as Stripe.Event);
    mockedStripeQueueAdd.mockRejectedValue(new Error(errorMessage));

    const req = createMockRequest(JSON.stringify(mockEvent));

    // Act
    const response = await POST(req);
    const text = await response.text();

    // Assert
    expect(response.status).toBe(500);
    expect(text).toBe('Failed to enqueue webhook event.');
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        err: expect.any(Error),
        eventType: 'invoice.payment_succeeded',
      }),
      'Failed to enqueue Stripe event.',
    );
  });
});