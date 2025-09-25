import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { NotAuthorizedError } from './lib/permissions';
// import { validateUserOrgAccessServer } from './lib/server-utils';
import logger from './lib/logger';
// import { prisma } from './lib/db'; // Import prisma
// A importação do PrismaClient é necessária para `validateUserOrgAccess`.
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
      const authCheckResponse = await fetch(
        new URL(`/api/auth/check-org-access?userId=${token.sub}&orgId=${orgId}`, request.nextUrl.origin)
      );
      if (!authCheckResponse.ok) {
        const errorData = await authCheckResponse.json();
        throw new NotAuthorizedError(errorData.error || 'Not authorized');
      }
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
  // Proteção para rotas de dashboard
  if (pathname.startsWith("/dashboard")) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (!token || !token.sub) {
      // Se não autenticado, redireciona para a página de login
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", request.url);
      return NextResponse.redirect(loginUrl);
    }

    // Verifica se o usuário tem acesso à organização especificada na URL
    const orgIdMatch = pathname.match(/^\/dashboard\/([^\/]+)/);
    if (orgIdMatch) {
      const organizationId = orgIdMatch[1];
      try {
        const authCheckResponse = await fetch(
          new URL(`/api/auth/check-org-access?userId=${token.sub}&orgId=${organizationId}`, request.nextUrl.origin)
        );
        if (!authCheckResponse.ok) {
          const errorData = await authCheckResponse.json();
          throw new NotAuthorizedError(errorData.error || 'Not authorized');
        }
      } catch (error) {
        if (error instanceof NotAuthorizedError) {
          // Redireciona para uma página de erro ou dashboard padrão se não autorizado
          const errorUrl = new URL("/unauthorized", request.url);
          return NextResponse.redirect(errorUrl);
        }
        logger.error({ err: error as Error, pathname }, "Middleware validation error for dashboard access");
        const errorUrl = new URL("/error", request.url);
        return NextResponse.redirect(errorUrl);
      }
    }

    // Se autenticado e autorizado, permite o acesso
    const response = NextResponse.next();
    response.headers.set("x-tenant-host", host);
    response.headers.set("x-tenant-type", "dashboard");
    return response;
  }

  // Lógica para rotas de super-admin
  if (pathname.startsWith("/super-admin")) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (!token || token.role !== "SUPER_ADMIN") {
      // Se não for super admin, redireciona para o login ou para uma página de acesso negado
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", request.url);
      return NextResponse.redirect(loginUrl);
    }
    const response = NextResponse.next();
    response.headers.set("x-tenant-host", host);
    response.headers.set("x-tenant-type", "super-admin");
    return response;
  }

  // Lógica para a landing page e outras rotas públicas
  // Se o usuário estiver autenticado e tentando acessar a rota raiz, redireciona para o dashboard apropriado.
  if (pathname === "/") {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (token?.sub) {
      if (token.role === "SUPER_ADMIN") {
        return NextResponse.redirect(new URL("/super-admin", request.url));
      }
      if (token.organizations && token.organizations.length > 0) {
        return NextResponse.redirect(new URL(`/dashboard/${token.organizations[0].slug || token.organizations[0].id}`, request.url));
      }
      // Fallback para usuários autenticados sem organizações ou role específica
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  const response = NextResponse.next();
  response.headers.set("x-tenant-host", host);
  response.headers.set("x-tenant-type", "landing");
  return response;
}

/**
 * The main middleware function that wraps application logic with CORS handling.
 */
export async function middleware(request: NextRequest) {
  return handleAppLogic(request);
}