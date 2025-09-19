import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import logger from '@/lib/logger';
import { stripe } from '@/lib/stripe';
import { stripeWebhookQueue } from '@/lib/queues/stripe.queue';
import { Ratelimit } from '@upstash/ratelimit';
import { redisConnection } from '@/lib/queues/redis/redis.connection';

// Initialize rate limiter: 20 requests from the same IP in 10 seconds.
const ratelimit = new Ratelimit({
  redis: redisConnection,
  limiter: Ratelimit.slidingWindow(20, '10 s'),
  analytics: true,
  prefix: '@arkivame/ratelimit',
});

/**
 * Lida com os webhooks do Stripe para gerenciar o ciclo de vida das assinaturas.
 */
export async function POST(req: Request) {
  const ip = headers().get('x-forwarded-for') ?? '127.0.0.1';
  const { success, limit, remaining, reset } = await ratelimit.limit(ip);

  if (!success) {
    logger.warn({ ip, limit, remaining }, 'Rate limit exceeded for Stripe webhook.');
    return new NextResponse('Rate limit exceeded', {
      status: 429,
      headers: {
        'X-Ratelimit-Limit': limit.toString(),
        'X-Ratelimit-Remaining': remaining.toString(),
        'X-Ratelimit-Reset': reset.toString(),
      },
    });
  }

  const body = await req.text();
  const signature = headers().get('Stripe-Signature') as string;

  let event: Stripe.Event;

  try {
    // Verifica a assinatura do webhook para garantir que a requisição veio do Stripe
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (error: any) {
    logger.error({ err: error }, 'Stripe webhook signature verification failed');
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }

  // Em vez de processar, adiciona o evento à fila para processamento assíncrono
  try {
    await stripeWebhookQueue.add(event.type, { event });
    logger.info({ eventType: event.type }, 'Stripe event enqueued for processing.');
  } catch (error: any) {
    logger.error({ err: error, eventType: event.type }, 'Failed to enqueue Stripe event.');
    // Retorna 500 para que o Stripe tente enviar o webhook novamente
    return new NextResponse('Failed to enqueue webhook event.', { status: 500 });
  }

  // Responde imediatamente ao Stripe com sucesso
  return new NextResponse(null, { status: 200 });
}