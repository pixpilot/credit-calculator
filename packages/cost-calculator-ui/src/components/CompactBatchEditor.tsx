'use client';

import type { CalculatedCostBatch, CostBatch, CostPath } from '@pixpilot/cost-calculator';
import type { ReactNode } from 'react';

import { Card, CardContent } from '@pixpilot/shadcn-ui';
import { formatUsd } from '../utils/format-usd.ts';
import { CompactCostPath } from './CompactCostPath.tsx';
import { NumberSlider } from './NumberSlider.tsx';

const MAX_BATCH_QUANTITY = 1_000;

export interface CompactBatchEditorProps {
  batch: CostBatch;
  /** Overrides the card chrome when the editor is hosted inside a popover. */
  className?: string | undefined;
  result: CalculatedCostBatch;
  onChange: (batch: CostBatch) => void;
}

/** A two-column-friendly batch editor for configured admin cost scenarios. */
export function CompactBatchEditor({
  batch,
  className,
  onChange,
  result,
}: CompactBatchEditorProps): ReactNode {
  const updatePath = (index: number, path: CostPath) => {
    onChange({
      ...batch,
      paths: batch.paths.map((currentPath, pathIndex) =>
        pathIndex === index ? path : currentPath,
      ),
    });
  };

  return (
    <Card className={className}>
      <CardContent className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-sm font-medium">{batch.name}</h3>
          <span className="font-mono text-xs tabular-nums">
            {formatUsd(result.costPerExecution)} / use
          </span>
          <span className="font-mono text-xs font-medium tabular-nums">
            {formatUsd(result.totalCost)}
          </span>
        </div>

        <NumberSlider
          label={`${batch.name} quantity`}
          max={MAX_BATCH_QUANTITY}
          min={1}
          step={1}
          value={batch.quantity}
          valueLabel={batch.quantity.toLocaleString()}
          onChange={(quantity) => onChange({ ...batch, quantity })}
        />
        {batch.paths.map((path, index) => (
          <CompactCostPath
            key={path.name}
            path={path}
            result={result.paths[index]!}
            onChange={(nextPath) => updatePath(index, nextPath)}
          />
        ))}
      </CardContent>
    </Card>
  );
}
