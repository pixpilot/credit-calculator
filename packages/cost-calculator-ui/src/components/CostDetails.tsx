'use client';

import type { ReactNode } from 'react';

export interface CostDetailsProps {
  rows: Array<[string, string]>;
}

/** Renders a compact label-and-value cost breakdown. */
export function CostDetails({ rows }: CostDetailsProps): ReactNode {
  return (
    <dl className="grid content-end gap-1 text-sm sm:justify-self-end">
      {rows.map(([label, value]) => (
        <div key={label} className="flex min-w-44 justify-between gap-6">
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="font-mono tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
