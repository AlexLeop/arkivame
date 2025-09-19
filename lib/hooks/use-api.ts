'use client';

import { useOrganization } from '@/components/providers/organization-provider';
import { useCallback } from 'react';

interface ApiError {
  message: string;
}

async function fetcher<T>(
  endpoint: string,
  orgId: string | null,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  // O middleware requer este cabeçalho para rotas como /api/ai/**
  if (orgId) {
    headers.set('x-arkivame-org-id', orgId);
  }

  const res = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const errorInfo: ApiError = await res.json().catch(() => ({
      message: res.statusText || 'Ocorreu um erro desconhecido.',
    }));
    const error = new Error(errorInfo.message);
    (error as any).status = res.status;
    throw error;
  }

  if (res.status === 204) {
    return {} as T;
  }

  return res.json();
}

export const useApi = () => {
  const { activeOrganizationId } = useOrganization();

  const get = useCallback(
    <T>(endpoint: string, options?: RequestInit) => {
      return fetcher<T>(endpoint, activeOrganizationId, { ...options, method: 'GET' });
    },
    [activeOrganizationId]
  );

  const post = useCallback(
    <T>(endpoint: string, body: any, options?: RequestInit) => {
      return fetcher<T>(endpoint, activeOrganizationId, {
        ...options,
        method: 'POST',
        body: JSON.stringify(body),
      });
    },
    [activeOrganizationId]
  );

  const put = useCallback(
    <T>(endpoint: string, body: any, options?: RequestInit) => {
      return fetcher<T>(endpoint, activeOrganizationId, {
        ...options,
        method: 'PUT',
        body: JSON.stringify(body),
      });
    },
    [activeOrganizationId]
  );

  const del = useCallback(
    <T>(endpoint:string, options?: RequestInit) => {
      return fetcher<T>(endpoint, activeOrganizationId, { ...options, method: 'DELETE' });
    },
    [activeOrganizationId]
  );

  return { get, post, put, del };
};