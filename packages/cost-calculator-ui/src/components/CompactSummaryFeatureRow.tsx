'use client';

import type { CalculatedCostBatch } from '@pixpilot/cost-calculator';
import type { ReactNode } from 'react';
import { SliderInput } from '@pixpilot/shadcn-ui';

import { formatUsd } from '../utils/format-usd.ts';

const MAX_BATCH_QUANTITY = 1_000;

export interface CompactSummaryFeatureRowProps {
  batch: CalculatedCostBatch;
  /**
   * Control that opens this feature's settings card. The leading column is
   * dropped when the summary has no input batches to edit.
   */
  settings?: ReactNode;
  onQuantityChange: (quantity: number) => void;
}

/** One-line feature total with an inline slider for fast batch-quantity changes. */
export function CompactSummaryFeatureRow({
  batch,
  onQuantityChange,
  settings,
}: CompactSummaryFeatureRowProps): ReactNode {
  return (
    <tr className="border-border border-t">
      <td
        className="text-muted-foreground max-w-48 truncate py-2 pr-3"
        title={batch.name}
      >
        {batch.name}
      </td>
      {settings != null && <td className="w-8 py-2 pr-1">{settings}</td>}
      <td className="py-2 pr-3">
        <SliderInput
          aria-label={`Quantity for ${batch.name}`}
          max={Math.max(MAX_BATCH_QUANTITY, batch.quantity)}
          min={1}
          step={1}
          value={[batch.quantity]}
          onValueChange={([quantity]) => {
            if (quantity !== undefined) onQuantityChange(quantity);
          }}
          input={{ 'aria-label': `Quantity for ${batch.name}` }}
          slider={{ className: 'w-full' }}
        />
      </td>

      <td className="w-20 py-2 text-right font-mono tabular-nums">
        {formatUsd(batch.totalCost)}
      </td>
    </tr>
  );
}
