'use client';

import type { CalculatedCostBatch, CostBatch, CostPath } from '@pixpilot/cost-calculator';
import type { ReactNode } from 'react';

import { Button, Input, Label } from '@pixpilot/shadcn';
import { Card, CardContent } from '@pixpilot/shadcn-ui';
import { Plus, Trash2 } from 'lucide-react';
import { formatUsd } from '../utils/format-usd.ts';
import { CostPathEditor } from './CostPathEditor.tsx';

export interface BatchEditorProps {
  batch: CostBatch;
  canRemove: boolean;
  result: CalculatedCostBatch;
  onAddPath: () => void;
  onChange: (batch: CostBatch) => void;
  onRemove: () => void;
}

/** Edits one repeated operation batch and presents its calculated totals. */
export function BatchEditor({
  batch,
  canRemove,
  result,
  onAddPath,
  onChange,
  onRemove,
}: BatchEditorProps): ReactNode {
  const updatePath = (pathIndex: number, path: CostPath) => {
    onChange({
      ...batch,
      paths: batch.paths.map((currentPath, index) =>
        index === pathIndex ? path : currentPath,
      ),
    });
  };

  const removePath = (pathIndex: number) => {
    onChange({ ...batch, paths: batch.paths.filter((_, index) => index !== pathIndex) });
  };

  return (
    <Card>
      <CardContent className="space-y-5 pt-5">
        <div className="flex flex-wrap items-end gap-3">
          <div className="grid min-w-56 flex-1 gap-2">
            <Label htmlFor={`batch-name-${batch.name}`}>Batch</Label>
            <Input
              id={`batch-name-${batch.name}`}
              value={batch.name}
              onChange={(event) => {
                if (event.target.value.trim().length > 0) {
                  onChange({ ...batch, name: event.target.value });
                }
              }}
            />
          </div>
          <div className="grid w-36 gap-2">
            <Label htmlFor={`batch-quantity-${batch.name}`}>Quantity</Label>
            <Input
              id={`batch-quantity-${batch.name}`}
              min="1"
              step="1"
              type="number"
              value={batch.quantity}
              onChange={(event) => {
                const quantity = Number(event.target.value);
                onChange({
                  ...batch,
                  quantity: Number.isSafeInteger(quantity) && quantity > 0 ? quantity : 1,
                });
              }}
            />
          </div>
          <Button
            aria-label={`Remove ${batch.name} batch`}
            disabled={!canRemove}
            size="icon"
            title="Remove batch"
            variant="ghost"
            onClick={onRemove}
          >
            <Trash2 aria-hidden="true" />
          </Button>
        </div>

        <div className="space-y-4">
          {batch.paths.map((path, index) => (
            <CostPathEditor
              key={path.name}
              canRemove={batch.paths.length > 1}
              path={path}
              result={result.paths[index]!}
              onChange={(nextPath) => updatePath(index, nextPath)}
              onRemove={() => removePath(index)}
            />
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
          <Button size="sm" variant="outline" onClick={onAddPath}>
            <Plus aria-hidden="true" />
            Add cost path
          </Button>
          <dl className="grid gap-1 text-sm sm:min-w-56">
            <div className="flex justify-between gap-6">
              <dt className="text-muted-foreground">Cost per use</dt>
              <dd className="font-mono tabular-nums">
                {formatUsd(result.costPerExecution)}
              </dd>
            </div>
            <div className="flex justify-between gap-6 font-medium">
              <dt>Batch cost</dt>
              <dd className="font-mono tabular-nums">{formatUsd(result.totalCost)}</dd>
            </div>
          </dl>
        </div>
      </CardContent>
    </Card>
  );
}
