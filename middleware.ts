
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { validateUserOrgAccess, NotAuthorizedError } from './lib/permissions';
import logger from './lib/logger';
// import crypto from 'crypto';

// Define allowed origins. In production, this should come from a comma-separated environment variable.
const allowedOrigins = process.env.NODE_ENV === 'development'
  ? ['http://localhost:3000']
  // Example for production: 'https://www.yourapp.com,https://app.yourapp.com'
  : (process.env.CORS_ALLOWED_ORIGINS || '').split(',').filter(Boolean);

/**
 * The main application logic of the middleware.
 * It handles authentication, authorization, and tenant routing.
 */
async function handleAppLogic(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  const host = request.headers.get('host') || '';

  // 1. API route protection for /api/ai/**
  const apiAiRegex = /^\/api\/ai\//;
  if (apiAiRegex.test(pathname)) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    // Bloqueia se não houver um token de sessão válido
    if (!token || !token.sub) {
      logger.warn({ pathname }, 'Unauthorized access attempt to AI API.');
      return new NextResponse(JSON.stringify({ error: 'Authentication required.' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    // As rotas de IA precisam do contexto da organização para verificar o plano.
    // O cliente DEVE enviar o ID da organização no header 'x-arkivame-org-id'.
    const orgId = request.headers.get('x-arkivame-org-id');
    if (!orgId) {
      logger.warn({ pathname, userId: token.sub }, 'AI API call missing x-arkivame-org-id header.');
      return new NextResponse(JSON.stringify({ error: "Header 'x-arkivame-org-id' é obrigatório." }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Encontra a organização correspondente no token do usuário.
    const organization = token.organizations?.find(org => org.id === orgId);

    if (!organization) {
      logger.warn({ pathname, userId: token.sub, orgId }, 'User attempted to access AI API for an org they do not belong to.');
      return new NextResponse(JSON.stringify({ error: 'Acesso negado. Você não pertence a esta organização.' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }

    // Verifica se o plano da organização permite o uso de funcionalidades de IA (qualquer plano exceto o FREE).
    if (organization.plan === 'FREE') {
      logger.info({ pathname, userId: token.sub, orgId, plan: organization.plan }, 'AI feature access denied for FREE plan.');
      return new NextResponse(JSON.stringify({ error: 'Funcionalidades de IA não estão disponíveis no seu plano atual. Por favor, faça um upgrade para acessar.' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }

    // Acesso concedido para usuários autenticados em planos pagos.
    return NextResponse.next();
  }

  // 1. API route protection for /api/org/[orgId]/**
  const apiOrgRegex = /^\/api\/org\/([^\/]+)/;
  const apiOrgMatch = pathname.match(apiOrgRegex);

  if (apiOrgMatch) {
    const orgId = apiOrgMatch[1];
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (!token || !token.sub) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    try {
      // NOTE: Using `validateUserOrgAccess` requires Prisma, which might not be available
      // in the default Edge runtime. Ensure your middleware is configured for the Node.js runtime if needed.
      await validateUserOrgAccess(token.sub, orgId);
      return NextResponse.next(); // Acesso concedido
    } catch (error) {
      if (error instanceof NotAuthorizedError) {
        return new NextResponse(JSON.stringify({ error: error.message }), { status: 403, headers: { 'Content-Type': 'application/json' } });
      }
      logger.error({ err: error as Error, pathname }, 'Middleware validation error');
      return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
  }

  // 2. Lógica de frontend/tenant existente para renderização de páginas
  const response = NextResponse.next();

  response.headers.set('x-tenant-host', host);

  if (pathname.startsWith('/super-admin')) {
    response.headers.set('x-tenant-type', 'super-admin');
  } else {
    response.headers.set('x-tenant-type', 'landing');
  }
  
  return response;
}

/**
 * The main middleware function that wraps application logic with CORS handling.
 */
export async function middleware(request: NextRequest) {
  const origin = request.headers.get('origin');

  // Handle preflight (OPTIONS) requests
  if (request.method === 'OPTIONS') {
    if (origin && allowedOrigins.includes(origin)) {
      const preflightHeaders = {
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token',
        'Access-Control-Max-Age': '86400', // 24 hours
      };
      return new NextResponse(null, { status: 204, headers: preflightHeaders });
    } else {
      // Deny preflight from disallowed origins
      return new NextResponse(null, { status: 400, statusText: 'Bad Request' });
    }
  }

  // Handle actual request
  const response = await handleAppLogic(request);

  // Add CORS headers to the response
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  // Add security headers with a nonce-based CSP
  const nonce = Buffer.from(globalThis.crypto.randomUUID()).toString('base64');

  // In development, Next.js's Fast Refresh uses `eval` and inline scripts that are blocked by a strict CSP.
  const scriptSrc =
    process.env.NODE_ENV === 'development'
      ? `'self' 'unsafe-inline' 'unsafe-eval'`
      : `'self' 'nonce-${nonce}' 'strict-dynamic'`;

  let cspHeader = `
    default-src 'self';
    script-src ${scriptSrc};
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data: https:;
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';`;

  if (process.env.NODE_ENV === 'production') {
    cspHeader += ` upgrade-insecure-requests;`;
  }

  // The Next.js App Router will automatically use this nonce for its scripts.
  response.headers.set('Content-Security-Policy', cspHeader.replace(/\s{2,}/g, ' ').trim());
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Corresponde a todos os caminhos de requisição, exceto para aqueles que começam com:
     * - _next/static (arquivos estáticos)
     * - _next/image (arquivos de otimização de imagem)
     * - favicon.ico (arquivo de favicon)
     * - api/auth (rotas do NextAuth.js)
     * - api/integrations/webhook-slack (webhook público)
     * Isso garante que nosso middleware seja executado em páginas e rotas de API protegidas.
     */
    '/((?!_next/static|_next/image|favicon.ico|api/auth|api/webhooks/stripe|api/integrations/discord).*)',
  ],
};

// This is required to enable the middleware to run on the Node.js runtime.
// Prisma, which is used in `validateUserOrgAccess`, is not compatible with the
// Edge runtime.
export const runtime = 'nodejs';
