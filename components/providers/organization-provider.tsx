'use client';

import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { useSession } from 'next-auth/react';

interface Organization {
  id: string;
  name: string;
  slug: string;
  role: string;
  plan: string;
}

interface OrganizationContextType {
  organizations: Organization[];
  activeOrganizationId: string | null;
  switchOrganization: (orgId: string) => void;
  isLoading: boolean;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

const ACTIVE_ORG_ID_STORAGE_KEY = 'arkivame-active-org-id';

export const OrganizationProvider = ({ children }: { children: ReactNode }) => {
  const { data: session, status } = useSession();
  const [activeOrganizationId, setActiveOrganizationId] = useState<string | null>(null);

  const organizations = useMemo(() => session?.user?.organizations || [], [session?.user?.organizations]);
  const isLoading = status === 'loading';

  useEffect(() => {
    // Define a primeira organização como ativa por padrão ou carrega do localStorage
    if (!isLoading && organizations.length > 0 && !activeOrganizationId) {
      const storedOrgId = localStorage.getItem(ACTIVE_ORG_ID_STORAGE_KEY);
      if (storedOrgId && organizations.some(org => org.id === storedOrgId)) {
        setActiveOrganizationId(storedOrgId);
      } else if (organizations.length > 0) {
        setActiveOrganizationId(organizations[0].id);
      }
    }
  }, [isLoading, organizations, activeOrganizationId]);

  const switchOrganization = (orgId: string) => {
    if (organizations.some(org => org.id === orgId)) {
      setActiveOrganizationId(orgId);
      localStorage.setItem(ACTIVE_ORG_ID_STORAGE_KEY, orgId);
    } else {
      console.error('Tentativa de alternar para uma organização à qual o usuário não pertence.');
    }
  };

  const value = { organizations, activeOrganizationId, switchOrganization, isLoading };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
};

export const useOrganization = (): OrganizationContextType => {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganization deve ser usado dentro de um OrganizationProvider');
  }
  return context;
};