'use client';

import type { ReactNode } from 'react';

import { cn } from '@pixpilot/shadcn';

export interface PricingStatCardProps {
  className?: string | undefined;
  label: string;
  /** What the figure is about — the feature it belongs to, the mix it came from. */
  subtitle?: string | undefined;
  value: string;
}

/** One headline figure: a small capitalised label over a monospaced readout. */
export function PricingStatCard({
  className,
  label,
  subtitle,
  value,
}: PricingStatCardProps): ReactNode {
  return (
    <div className={cn('border-border/60 border p-3', className)}>
      <span className="text-muted-foreground block text-[0.6875rem] tracking-[0.08em] uppercase">
        {label}
      </span>
      <span className="mt-1 block truncate font-mono text-lg tabular-nums" title={value}>
        {value}
      </span>
      <span className="text-muted-foreground mt-0.5 block h-4 truncate text-[0.6875rem]">
        {subtitle ?? ''}
      </span>
    </div>
  );
}
