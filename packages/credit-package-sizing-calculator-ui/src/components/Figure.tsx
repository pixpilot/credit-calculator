'use client';

import type { ReactNode } from 'react';

export interface FigureProps {
  children?: ReactNode;
  hint?: string | undefined;
  label: string;
  value: string;
}

/**
 * One labelled figure, as a definition rather than as two loose lines.
 *
 * Every number on this screen is only meaningful next to the question it
 * answers — a cost per credit and a price per credit look identical and mean
 * opposite things — so the label travels with the value everywhere it is
 * shown.
 */
export function Figure({ children, hint, label, value }: FigureProps): ReactNode {
  return (
    <div className="space-y-0.5">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="font-mono text-sm font-medium tabular-nums">{value}</dd>
      {hint != null && <p className="text-muted-foreground text-xs">{hint}</p>}
      {children}
    </div>
  );
}
