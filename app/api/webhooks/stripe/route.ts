import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import logger from '@/lib/logger';
import { stripe } from '@/lib/stripe';
import { getStripeQueue } from '@/lib/queues/stripe.queue';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from 'ioredis';

let redis: Redis | null = null;

function getRedisConnection() {
    if (redis) {
        return redis;
    }

    if (process.env.REDIS_URL) {
        redis = new Redis(process.env.REDIS_URL);
        return redis;
    }
    
    return null;
}

let ratelimit: Ratelimit | null = null;

function getRateLimiter() {
    if (ratelimit) {
        return ratelimit;
    }

    const redisConn = getRedisConnection();
    if (!redisConn) {
        return null;
    }

    ratelimit = new Ratelimit({
        redis: {
            // @ts-ignore
            set: (key: string, value: string, opts: any) => redisConn.set(key, value, 'EX', opts.ex),
            // @ts-ignore
            eval: async <T = any>(script: string, keys: string[], args: any[]): Promise<T> => {
                const result = await redisConn.eval(script, keys.length, ...keys, ...args);
                return result as T;
            },
        },
        limiter: Ratelimit.slidingWindow(20, '10 s'),
        analytics: true,
        prefix: '@arkivame/ratelimit',
    });

    return ratelimit;
}


/**
 * Lida com os webhooks do Stripe para gerenciar o ciclo de vida das assinaturas.
 */
export async function POST(req: Request) {
  const limiter = getRateLimiter();
  if (limiter) {
    const ip = headers().get('x-forwarded-for') ?? '127.0.0.1';
    const { success, limit, remaining, reset } = await limiter.limit(ip);

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
    const stripeQueue = getStripeQueue();
    if (!stripeQueue) {
        logger.error('Stripe queue not initialized');
        return new NextResponse('Stripe queue not initialized', { status: 500 });
    }
    await stripeQueue.add(event.type, { event });
    logger.info({ eventType: event.type }, 'Stripe event enqueued for processing.');
  } catch (error: any) {
    logger.error({ err: error, eventType: event.type }, 'Failed to enqueue Stripe event.');
    // Retorna 500 para que o Stripe tente enviar o webhook novamente
    return new NextResponse('Failed to enqueue webhook event.', { status: 500 });
  }

  // Responde imediatamente ao Stripe com sucesso
  return new NextResponse(null, { status: 200 });
}
