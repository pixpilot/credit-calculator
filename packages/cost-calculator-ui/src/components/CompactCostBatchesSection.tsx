'use client';

import type { CostBatch, CostCalculatorResult } from '@pixpilot/cost-calculator';
import type { Dispatch, ReactNode, SetStateAction } from 'react';

import { CompactBatchEditor } from './CompactBatchEditor.tsx';

export interface CompactCostBatchesSectionProps {
  /** Lets the toggle that reveals this section reference it with `aria-controls`. */
  id?: string | undefined;
  result: CostCalculatorResult;
  update: Dispatch<SetStateAction<CostBatch[]>>;
  value: CostBatch[];
}

/** Edits configured batches in a dense grid without the generic add/remove controls. */
export function CompactCostBatchesSection({
  id,
  result,
  update,
  value,
}: CompactCostBatchesSectionProps): ReactNode {
  return (
    <section id={id} aria-labelledby="cost-calculator-batches" className="space-y-3">
      <h2 id="cost-calculator-batches" className="text-sm font-medium">
        Feature estimates
      </h2>
      <div className="grid gap-3 lg:grid-cols-2">
        {value.map((batch, index) => (
          <CompactBatchEditor
            key={batch.name}
            batch={batch}
            result={result.batches[index]!}
            onChange={(nextBatch) =>
              update((currentValue) =>
                currentValue.map((currentBatch, batchIndex) =>
                  batchIndex === index ? nextBatch : currentBatch,
                ),
              )
            }
          />
        ))}
      </div>
    </section>
  );
}
