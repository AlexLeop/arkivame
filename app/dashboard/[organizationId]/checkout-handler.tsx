'use client';

import { ReactNode } from 'react';

interface CheckoutHandlerProps {
  children: ReactNode;
  organizationId: string;
}

export function CheckoutHandler({ children, organizationId }: CheckoutHandlerProps) {
  // This component would handle Stripe checkout flows
  // For now, it's just a wrapper that passes through children
  
  return <>{children}</>;
}

