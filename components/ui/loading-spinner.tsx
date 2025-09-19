
'use client';

import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };
  
  return (
    <div className={cn('animate-spin rounded-full border-2 border-muted border-t-secondary', sizeClasses[size], className)} />
  );
}

export function LoadingCard() {
  return (
    <div className="arkivame-card p-6 space-y-4">
      <div className="arkivame-skeleton h-6 w-3/4 rounded" />
      <div className="space-y-2">
        <div className="arkivame-skeleton h-4 w-full rounded" />
        <div className="arkivame-skeleton h-4 w-5/6 rounded" />
        <div className="arkivame-skeleton h-4 w-4/6 rounded" />
      </div>
      <div className="flex space-x-2">
        <div className="arkivame-skeleton h-6 w-16 rounded-full" />
        <div className="arkivame-skeleton h-6 w-20 rounded-full" />
      </div>
    </div>
  );
}

export function LoadingPage() {
  return (
    <div className="arkivame-container py-8 space-y-8">
      <div className="arkivame-skeleton h-10 w-64 rounded" />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <LoadingCard key={i} />
        ))}
      </div>
    </div>
  );
}

export default LoadingSpinner;
