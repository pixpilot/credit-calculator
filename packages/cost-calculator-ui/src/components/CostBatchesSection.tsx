'use client';

import type { CostBatch, CostCalculatorResult } from '@pixpilot/cost-calculator';
import type { Dispatch, ReactNode, SetStateAction } from 'react';

import { Button } from '@pixpilot/shadcn';
import { Plus } from 'lucide-react';
import { BatchEditor } from './BatchEditor.tsx';

export interface CostBatchesSectionProps {
  result: CostCalculatorResult;
  update: Dispatch<SetStateAction<CostBatch[]>>;
  value: CostBatch[];
}

/** Edits batches and their cost paths while retaining the calculator's valid input shape. */
export function CostBatchesSection({
  result,
  update,
  value,
}: CostBatchesSectionProps): ReactNode {
  const addBatch = () => {
    update((currentValue) => [
      ...currentValue,
      {
        name: findAvailableName(
          currentValue.map((batch) => batch.name),
          'new-batch',
        ),
        paths: [{ costPerExecution: 0, name: 'Fixed cost', type: 'fixed' }],
        quantity: 1,
      },
    ]);
  };

  return (
    <section aria-labelledby="cost-calculator-batches" className="space-y-4">
      <h2 id="cost-calculator-batches" className="text-base font-medium">
        Batches
      </h2>
      {value.map((batch, index) => (
        <BatchEditor
          key={batch.name}
          batch={batch}
          canRemove={value.length > 1}
          result={result.batches[index]!}
          onAddPath={() =>
            update((currentValue) =>
              currentValue.map((currentBatch, batchIndex) =>
                batchIndex === index
                  ? {
                      ...currentBatch,
                      paths: [
                        ...currentBatch.paths,
                        { costPerExecution: 0, name: 'Fixed cost', type: 'fixed' },
                      ],
                    }
                  : currentBatch,
              ),
            )
          }
          onChange={(nextBatch) =>
            update((currentValue) =>
              currentValue.map((currentBatch, batchIndex) =>
                batchIndex === index ? nextBatch : currentBatch,
              ),
            )
          }
          onRemove={() =>
            update((currentValue) =>
              currentValue.filter((_, batchIndex) => batchIndex !== index),
            )
          }
        />
      ))}
      <Button size="sm" variant="outline" onClick={addBatch}>
        <Plus aria-hidden="true" />
        Add batch
      </Button>
    </section>
  );
}

function findAvailableName(existingNames: string[], baseName: string): string {
  if (!existingNames.includes(baseName)) return baseName;

  const firstNumericSuffix = 2;
  let suffix = firstNumericSuffix;
  while (existingNames.includes(`${baseName}-${suffix}`)) suffix += 1;

  return `${baseName}-${suffix}`;
}
